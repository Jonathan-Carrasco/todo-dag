import { removeTime } from "@/app/utils/dataFormatters";

/** 
 * Schema interface representing a todo item as stored in the database
 * This matches the Prisma schema definition and is used for API communication
 */
export type TodoSchema = {
  id: number; // Unique identifier for the todo
  title: string; // Display title/description of the todo
  dueDate: string | null; // Due date in ISO string format, null if no due date
  imageUrl: string; // URL for the todo's associated image from Pexels API
  duration: number; // Estimated duration in hours to complete the todo
  dependencies: number[]; // Array of todo IDs that this todo depends on
}

/**
 * Todo class used for UI display and business logic
 * Provides a rich object model with computed properties and methods
 * Converts between database schema and application state
 */
class Todo {
  public id: number; // Unique identifier matching the database
  public title: string; // Cleaned title (trimmed whitespace)
  public dueDate: string; // Due date in YYYY-MM-DD format, empty string if no due date
  public imageUrl: string; // URL for the associated image
  public duration: number; // Duration in hours
  public minimumHours: number; // Minimum number of hours required to complete dependencies of Todo

  /**
   * Constructs a Todo instance from a database TodoSchema
   * Performs data transformation and sets initial computed values
   * @param todo - TodoSchema object from database/API
   */
  constructor(todo: TodoSchema) {
    this.id = todo.id;
    this.title = todo.title.trim(); // Remove leading/trailing whitespace
    this.dueDate = todo.dueDate ? removeTime(todo.dueDate) : '', // Convert to YYYY-MM-DD or empty
    this.imageUrl = todo.imageUrl;
    this.duration = todo.duration || 0; // Default to 0 if undefined
    this.minimumHours = 0; // Initial value, calculated by DAG manager
  }

  /**
   * Converts the Todo instance back to TodoSchema format for API calls
   * Note: Dependencies are managed by the DAG system, not stored in the Todo object
   * @returns TodoSchema object suitable for database operations
   */
  toSchema(): TodoSchema {
    return {
      id: this.id,
      title: this.title,
      dueDate: this.dueDate || null, // Convert empty string back to null
      imageUrl: this.imageUrl,
      duration: this.duration,
      dependencies: [], // Dependencies are managed by the DAG, not stored here
    };
  }
}

export default Todo;