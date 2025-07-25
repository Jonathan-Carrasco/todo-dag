import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/todos
 * Retrieves all todos from the database
 * @returns JSON array of all TodoSchema objects
 */
export async function GET() {
  try {
    const todos = await prisma.todo.findMany();
    return NextResponse.json(todos);
  } catch (error) {
    // Make sure that env variables are set correctly
    const pg_conn_string = process.env.POSTGRES_URL
    const pexel_key = process.env.PEXELS_API_KEY
    const pg_error = pg_conn_string ? 
      'Error fetching todos' :
      `Invalid Posgres connection string: ${pg_conn_string}. `;
    const pexels_error = pexel_key ? '' : `Invalid Pexels API key: ${pexel_key}.`;

    return NextResponse.json({ error: pg_error+pexels_error }, { status: 500 });
  }
}

/**
 * POST /api/todos
 * Creates a new todo with the provided data
 * @param request - Request body should contain: { title, dueDate?, duration }
 * @returns JSON of the created TodoSchema object
 */
export async function POST(request: Request) {
  try {
    const { title, dueDate, duration } = await request.json();
 
    // Validate required fields
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create new todo with empty imageUrl (will be populated by image service)
    const todo = await prisma.todo.create({
      data: {
        title: title.trim(),
        dueDate: dueDate ? new Date(dueDate) : null,
        imageUrl: '', // Initially empty, populated later by Pexels API
        duration: duration,
        dependencies: [], // New todos start with no dependencies
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ error: 'Error creating todo' }, { status: 500 });
  }
}