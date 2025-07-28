"use client"

import { useState, useEffect, useRef } from 'react';
import Todo, { TodoSchema } from '@/app/types/todo';
import { dagManager } from '@/app/utils/dag';
import { useD3Graph } from '@/app/utils/d3Graph';
import TodoList from '@/app/components/TodoList';
import TodoForm from '@/app/components/TodoForm';
import AddDependencyForm from '@/app/components/AddDependencyForm';

/**
 * Main page component for the Todo DAG application
 * Manages the overall state and coordinates between the todo list, form, and graph visualization
 */
export default function Home() {
  // Reference to the SVG element for D3 graph rendering
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Currently selected todo for editing
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  
  // Todo for which critical path should be displayed
  const [criticalTodo, setCriticalTodo] = useState<Todo | null>(null);
  
  // Version counter to trigger graph updates
  const [dagVersion, setDagVersion] = useState<number>(0);
  
  // Root todos (todos with no dependencies) for the hierarchical display
  const [rootTodos, setRootTodos] = useState<Todo[]>([]);

  // Number of todos that exist -- used in determing whether certain forms can be displayed
  const [numTodos, setNumTodos] = useState<number>(0);

  /**
   * Triggers a DAG update by incrementing the version counter
   * This causes the graph and todo list to refresh
   */
  const triggerDagUpdate = () => {
    setDagVersion(prev => prev + 1); 
  }

  // Update the D3 graph whenever the DAG structure changes
  useD3Graph(svgRef, dagVersion, criticalTodo?.id);

  // Update the todo list and form visibility whenever the DAG structure changes
  useEffect(() => {
    setRootTodos(dagManager.getTodosByIds(dagManager.rootNodes));
    setNumTodos(dagManager.numTodos);
  }, [dagVersion]);

  // Initialize the application by fetching todos from the API on component mount
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const res = await fetch('/api/todos');

        if (!res.ok) {
          throw new Error(await res.text());
        }
        
        const data: TodoSchema[] = await res.json();
        dagManager.initialize(data);  

        triggerDagUpdate();
      } catch (error) {
        console.error('Failed to fetch todos:', error);
      }
    };

    fetchTodos();
  }, []);

  /**
   * Handles deletion of a todo item
   * Updates both the backend database and the local DAG structure
   */
  const handleDeleteTodo = async (todoId: number) => {
    const children = dagManager.getChildrenOf(todoId);

    try {
      // Delete the todo and update all parent dependencies in the database
      await fetch('/api/todos/delete-todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deletedId: todoId,
          dependencies: children
        }),
      })
      .then(async response => {
        if (!response.ok) {
          throw new Error(await response.text());
        }
        
        // Remove from local DAG manager and refresh UI
        dagManager.deleteNode(todoId);
        triggerDagUpdate();    
      })
      .catch(error => {
        console.error('Failed to delete todo:', error);
      });
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-50 relative bg-gradient-to-b from-indigo-300 to-indigo-700">
      {/* Todo List Panel - positioned on the left side */}
      <div className="absolute top-6 left-6 z-20 w-96">
      {numTodos > 0 && (
        <TodoList
          rootTodos={rootTodos}
          onDelete={handleDeleteTodo}
          onSelect={setSelectedTodo}
          onShowCriticalPath={setCriticalTodo}
        />)}
      </div>

      {/* Todo Form and Dependency Management Panel - positioned on the right side */}
      <div className="absolute top-6 right-6 z-10 bg-white rounded-lg shadow-lg border max-w-md">
        <TodoForm
          onRefreshList={() => setRootTodos(dagManager.getTodosByIds(dagManager.rootNodes))}
          onRefreshGraph={triggerDagUpdate}
          selectedTodo={selectedTodo}
          onClearSelection={() => setSelectedTodo(null)}
        />

        {/* Show dependency form when a dependency can be created */}
        {numTodos > 1 && 
          (<AddDependencyForm onDagUpdate={triggerDagUpdate}/>)}
      </div>

      {/* Dependency Graph Visualization - fills the entire background */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="absolute inset-0"
      />
    </div>
  );
};
