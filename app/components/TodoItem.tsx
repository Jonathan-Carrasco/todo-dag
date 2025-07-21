"use client"

import { useState } from 'react';
import Todo from '@/app/types/todo';
import { getEarliestStart, isOverdue } from '@/app/utils/dataFormatters';
import { dagManager } from '@/app/utils/dag';
import TodoImage from '@/app/components/TodoImage';
import { ExpandIcon, EditIcon, DeleteIcon, ZigZagArrowIcon } from '@/app/components/SvgIcons';

interface TodoItemProps {
  todo: Todo; // The todo item to display
  onDelete: (id: number) => void; // Callback when this todo is deleted
  onSelect: (todo: Todo) => void; // Callback when this todo is selected for editing
  onShowCriticalPath: (todo: Todo) => void; // Callback when critical path should be shown for this todo
}

/**
 * TodoItem component displays an individual todo with its dependencies
 * Supports hierarchical display with expand/collapse functionality
 * Shows todo details, action buttons, and nested dependencies
 */
const TodoItem = ({ todo, onDelete, onSelect, onShowCriticalPath }: TodoItemProps) => {
  // State to control whether this item's dependencies are expanded
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * Sorts todos by due date for consistent display order
   * Todos without due dates come first, followed by todos sorted by due date
   */
  const orderTodosByDueDate = (todoIds: number[]): Todo[] => {
    const todos = dagManager.getTodosByIds(todoIds);
    const withoutDueDate = todos.filter((todo) => todo.dueDate === null);
    const sortedByDueDate = todos
      .filter((todo) => todo.dueDate !== null)
      .sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0;
        return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
      });
    
    return [...withoutDueDate, ...sortedByDueDate];
  }

  // Get this dependencies of this todo
  const dependencies = orderTodosByDueDate(dagManager.getChildrenOf(todo.id));

  /**
   * Handles toggling the expand/collapse state
   * Only allows expansion if there are dependencies to show
   */
  const handleToggle = () => {
    if (dependencies.length > 0) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="w-full">
      {/* Main todo item display */}
      <div 
        className={`flex items-center p-3 border-b justify-start border-gray-200 hover:bg-gray-50 transition-colors duration-150`}
        onClick={handleToggle}
      >
        
        {/* Expand/collapse icon - only shown if there are dependencies */}
        {dependencies.length > 0 && (
          <div className="flex-shrink-0 mr-2" onClick={handleToggle}>
            <ExpandIcon 
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </div>
        )}
        
        {/* Todo image from Pexels API or loading spinner */}
        <TodoImage imageUrl={todo.imageUrl} title={todo.title}/>
        
        {/* Todo content: title, due date, and earliest start time */}
        <div className="flex-grow">
          <span className="text-gray-800 font-medium">{todo.title}</span>
          {todo.dueDate && (
            <div className={`text-sm mt-1 ${isOverdue(todo.dueDate) ? 'text-red-500' : 'text-gray-600'}`}>
              Due: {todo.dueDate}
            </div>
          )}
          
          {/* Earliest possible start time based on dependencies */}
          <div className="text-sm mt-1 text-green-600">
            {getEarliestStart(todo.minimumHours)}
          </div>
        </div>

        {/* Action buttons arranged vertically */}
        <div className="flex flex-col space-y-1">
          {/* Edit button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(todo);
            }}
            className="text-blue-500 hover:text-blue-700 transition duration-300"
            title="Edit todo"
          >
            <EditIcon />
          </button>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(todo.id);
            }}
            className="text-red-500 hover:text-red-700 transition duration-300"
            title="Delete todo"
          >
            <DeleteIcon />
          </button>

          {/* Show critical path button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowCriticalPath(todo);
            }}
            className="text-indigo-500 hover:text-indigo-700 transition duration-300"
            title="Show critical path"
          >
            <ZigZagArrowIcon />
          </button>
        </div>
      </div>
      
      {/* Nested dependencies - shown when expanded */}
      {dependencies.length > 0 && isExpanded && (
        <div className="ml-4 border-l-2 border-gray-200">
          {dependencies.map((child: Todo) => (
            <TodoItem 
              key={child.id}
              onDelete={onDelete}
              onSelect={onSelect}
              onShowCriticalPath={onShowCriticalPath}
              todo={child}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoItem; 