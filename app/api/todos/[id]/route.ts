import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TodoSchema } from '@/app/types/todo';

/**
 * Route parameters interface for dynamic todo routes
 */
interface Params {
  params: {
    id: string; // Todo ID from the URL path
  };
}

/**
 * PATCH /api/todos/[id]
 * Updates an existing todo with new data (partial updates supported)
 * @param request - Request body can contain any TodoSchema fields to update
 * @param params - URL parameters containing the todo ID
 * @returns JSON of the updated TodoSchema object
 */
export async function PATCH(request: Request, { params }: Params) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const todoData: Partial<TodoSchema> = await request.json();

    // Check if the todo exists before attempting to update
    const existingTodo = await prisma.todo.findUnique({
      where: { id },
    });

    if (!existingTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Build update object with only defined fields to support partial updates
    const updateData: any = {};
   
    if (todoData.title !== undefined) updateData.title = todoData.title;
    if (todoData.dueDate !== undefined) updateData.dueDate = todoData.dueDate ? new Date(todoData.dueDate) : null;
    if (todoData.duration !== undefined) updateData.duration = todoData.duration;
    if (todoData.imageUrl !== undefined) updateData.imageUrl = todoData.imageUrl;
    if (todoData.dependencies !== undefined) updateData.dependencies = todoData.dependencies;

    // Update the todo in the database
    const updatedTodo = await prisma.todo.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(updatedTodo, { status: 200 });
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json({ error: 'Error updating todo' }, { status: 500 });
  }
}