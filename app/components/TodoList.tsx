"use client"

import { useState } from 'react';
import Todo from '@/app/types/todo';
import TodoItem from '@/app/components/TodoItem';

interface TodoListProps {
  rootTodos: Todo[]; // Root-level todos (no dependencies) to display in hierarchical structure
  onDelete: (id: number) => void; 
  onSelect: (todo: Todo) => void;
  onShowCriticalPath: (todo: Todo) => void;
}

/**
 * TodoList component displays a collapsible hierarchical list of todos
 * Shows root todos and their dependencies in a tree structure
 */
const TodoList = ({ rootTodos, onDelete, onSelect, onShowCriticalPath }: TodoListProps) => {
  // State to control whether the todo list is expanded or collapsed
  const [showTodoList, setShowTodoList] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-lg border">
      {/* Toggle button to show/hide the todo list */}
      <button
        className="w-full text-left px-4 py-2 font-bold text-gray-800 bg-gray-100 rounded-lg focus:outline-none"
        onClick={() => setShowTodoList((prev) => !prev)}
      >
        {showTodoList ? 'Hide Todos' : 'Show Todos'}
      </button>
      
      {/* Todo list content - only shown when expanded */}
      {showTodoList && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="divide-y divide-gray-200">
            {rootTodos.length > 0 && (
              rootTodos.map((todo) => (
                <TodoItem 
                  key={todo.id} 
                  todo={todo} 
                  onDelete={onDelete}
                  onSelect={onSelect}
                  onShowCriticalPath={onShowCriticalPath}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoList; 