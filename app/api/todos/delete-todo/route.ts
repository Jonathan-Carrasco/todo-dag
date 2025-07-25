import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-extended';

/**
 * POST /api/todos/delete-todo
 * Deletes a todo and removes it from all parent dependency arrays in a single transaction
 * This ensures referential integrity when removing todos that are dependencies of other todos
 * 
 * @param request - Request body should contain:
 *   - deletedId: number - ID of the todo to delete
 *   - parentsToUpdate: number[] - IDs of todos that have deletedId as a dependency
 * @returns Success message with count of updated parents
 */
export async function POST(request: Request) {
  try {
    const { parentsToUpdate, deletedId } = await request.json();

    // Validate input parameters
    if (!Array.isArray(parentsToUpdate)) {
      return NextResponse.json({ error: 'parentsToUpdate must be an array' }, { status: 400 });
    }

    if (typeof deletedId !== 'number') {
      return NextResponse.json({ error: 'deletedId must be a number' }, { status: 400 });
    }

    // Validate and parse parent IDs
    const parentIds = parentsToUpdate.map((id: any) => {
      const todoId = parseInt(id);
      if (isNaN(todoId)) {
        throw new Error(`Invalid todo ID: ${id}`);
      }
      return todoId;
    });

    // Perform deletion and dependency cleanup in a single database transaction
    await prisma.$transaction(async (tx) => {
      // First, delete the target todo
      await tx.todo.delete({ where: { id: deletedId } });

      // Then, remove the deleted todo's ID from all parent dependency arrays
      if (parentIds.length > 0) {
        await tx.todo.removeFromArrayField(
          'dependencies',
          deletedId,
          { id: { in: parentIds } }
        );
      }
    });

    return NextResponse.json({ 
      message: `Successfully deleted ${deletedId} and updated ${parentIds.length} parents`,
    }, { status: 200 });

  } catch (error) {
    console.error('Error in batch delete:', error);
    return NextResponse.json({ error: `Error deleting todos: ${error}` }, { status: 500 });
  }
} 