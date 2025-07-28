"use client"

import { useState, useEffect } from 'react';
import { parseToInt } from '@/app/utils/dataFormatters';
import Todo, { TodoSchema } from '@/app/types/todo';
import { dagManager } from '@/app//utils/dag';
import { fetchImageForTodo } from '@/app/utils/imageService';

/**
 * Props interface for the TodoForm component
 */
interface TodoFormProps {
  onRefreshList: () => void; // Callback to refresh the todo list display
  onRefreshGraph: () => void; // Callback to refresh the dependency graph
  onClearSelection: () => void; // Callback to clear the currently selected todo
  selectedTodo: Todo | null; // Currently selected todo for editing, null for creating new todo
}

/**
 * TodoForm component handles both creating new todos and editing existing ones
 * Provides form inputs for title, due date, and duration
 * Integrates with image fetching service to get relevant images from Pexels API
 */
export default function TodoForm({ onRefreshList, onRefreshGraph, onClearSelection, selectedTodo }: TodoFormProps) {
  // Form state for todo properties
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<string>(''); // YYYY-MM-DD format
  const [duration, setDuration] = useState<number | null>(null);
  
  // Controls whether the form is expanded or collapsed
  const [showAddForm, setShowAddForm] = useState(false);

  /**
   * Updates form fields when a todo is selected for editing
   * Clears form when no todo is selected (creating new todo)
   */
  useEffect(() => {
    if (selectedTodo) {
      setTitle(selectedTodo.title);
      setDueDate(selectedTodo.dueDate || '');
      setDuration(selectedTodo.duration || null);
      setShowAddForm(true); // Automatically open form when editing
    } else {
      setTitle('');
      setDueDate('');
      setDuration(null);
    }
  }, [selectedTodo]);

  /**
   * Callback function to update a todo's image URL in the local state
   * Called when image fetching from Pexels API completes
   */
  const handleImageUpdate = (todoId: number, imageUrl: string) => {
    dagManager.getTodoWithId(todoId)!.imageUrl = imageUrl;
    onRefreshList(); // Update the todo list to show the new image
  };

  /**
   * Handles creation of a new todo
   * Posts to API, adds to DAG manager, and fetches relevant image
   */
  const handleAddTodo = async (title: string, dueDate: String, duration: number) => {
    if (!title.trim()) return;

    try {
      // Create todo in database without image URL initially
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: title.trim(),
          dueDate: dueDate,
          duration: duration,
        }),
      })
      .then(async response => {
        if (!response.ok) {
          throw new Error(await response.text());
        }

        const newTodoData: TodoSchema = await response.json();
        const newTodo = new Todo(newTodoData);
        
        // Add to local DAG manager and refresh graph
        dagManager.addTodo(newTodo);
        onRefreshGraph();

        // Fetch relevant image from Pexels API in the background
        fetchImageForTodo(newTodo.id, title, handleImageUpdate);     
      })
      .catch(error => {
        console.error('Failed to add todo:', error);
      });
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  /**
   * Handles editing of an existing todo
   * Updates the todo in database and fetches new image if title changed
   */
  const handleEditTodo = async (todo: Todo) => {
    try {
      // Update todo in database
      await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: todo.title.trim(),
          dueDate: todo.dueDate,
          duration: todo.duration,
          imageUrl: todo.imageUrl
        }),
      })
      .then(async response => {
        if (!response.ok) {
          throw new Error(await response.text());
        }
        
        // Refresh graph to reflect changes
        onRefreshGraph();

        // Fetch new image based on updated title
        fetchImageForTodo(todo.id, todo.title, handleImageUpdate);     
      })
      .catch(error => {
        console.error('Failed to add todo:', error);
      });
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  /**
   * Handles form submission for both creating and editing todos
   * Delegates to appropriate handler based on whether a todo is selected
   */
  const handleSubmit = () => {
    if (!title.trim()) return;

    if (selectedTodo) {
      // Update existing todo
      selectedTodo.title = title.trim();
      selectedTodo.dueDate = dueDate;
      selectedTodo.duration = duration || 0;
      handleEditTodo(selectedTodo);
    } else {
      // Create new todo
      handleAddTodo(title, dueDate, duration || 0);
    }
    
    // Reset form state
    setTitle('');
    setDueDate('');
    setDuration(null);
    onClearSelection();
  };

  /**
   * Handles duration input validation
   * Only allows positive integers, handles empty input gracefully
   */
  const handleDurationChange = (value: string) => {
    // Allow users to clear the input
    if (value === "") {
      setDuration(null);
      return;
    }

    const num = parseToInt(value);
    if (isNaN(num)) return;

    // Only allow non-negative integers
    if (num >= 0) {
      setDuration(num);
    }
  };

  return (
    <div className="border-b">
      {/* Toggle button to show/hide the form */}
      <button
        className="w-full text-left px-4 py-2 font-bold text-gray-800 bg-gray-100 rounded-t-lg focus:outline-none"
        onClick={() => setShowAddForm((prev) => !prev)}
      >
        {showAddForm ? 'Hide Add Todo' : 'Show Add Todo'}
      </button>
      
      {/* Form content - only shown when expanded */}
      {showAddForm && (
        <div className="p-4">
          {/* Main input row with title, due date, and submit button */}
          <div className="flex mb-4 border-orange-500 border-2 rounded-lg">
            <div className="flex flex-1 min-w-0">
              <input
                type="text"
                className="flex-1 p-3 rounded-l-full focus:outline-none text-gray-700 min-w-0"
                placeholder="New todo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input 
                type="date"
                className="flex-shrink-0 bg-white text-indigo-600 p-2 hover:bg-gray-100 transition duration-300"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <button
              onClick={handleSubmit}
              className="bg-white text-indigo-600 p-2 rounded-r-full hover:bg-gray-100 transition duration-300"
            >
              {selectedTodo ? 'Edit' : 'Add'}
            </button>
            
            {/* Cancel button - only shown when editing */}
            {selectedTodo && (
              <button
                onClick={onClearSelection}
                className="bg-white text-gray-500 p-2 rounded-full hover:bg-gray-100 transition duration-300"
                title="Cancel editing"
              >
                Cancel
              </button>
            )}
          </div>
     
          {/* Duration input field */}
          <input
            type="text"
            placeholder="Duration (hours)"
            value={duration || ''}
            onChange={(e) => handleDurationChange(e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm text-indigo-600"
          />
        </div>
      )}
    </div>
  );
} 

