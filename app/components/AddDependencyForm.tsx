"use client"

import { useState } from 'react';
import Todo from '@/app/types/todo';
import { parseToInt } from '@/app/utils/dataFormatters';
import { dagManager } from '@/app/utils/dag';

/**
 * Props interface for the AddDependencyForm component
 */
interface AddDependencyFormProps {
  onDagUpdate: () => void; // Callback to trigger DAG and UI updates when dependencies change
}

/**
 * AddDependencyForm component allows users to create dependencies between todos
 * Provides dropdowns to select source and target todos with cycle prevention
 * Ensures DAG integrity by only showing safe dependency targets
 */
export default function AddDependencyForm({ onDagUpdate }: AddDependencyFormProps) {
  // Selected todo that must be completed first (dependency source)
  const [sourceTodoId, setSourceTodoId] = useState<number | null>(null);
  
  // Selected todo that depends on the source (dependency target)
  const [targetTodoId, setTargetTodoId] = useState<number | null>(null);
  
  // Controls whether the dependency form is expanded or collapsed
  const [showDependencyForm, setShowDependencyForm] = useState(false);

  /**
   * Handles adding a new dependency relationship between two todos
   * Updates both the local DAG and the database, with rollback on failure
   */
  const handleAddDependency = async (from: number, to: number): Promise<void> => {
    // Attempt to add dependency to local DAG first for validation
    if (!dagManager.addDependency(from, to)) {
      // DAG rejected the dependency (would create a cycle or dependency already exists)
      return;
    }
    
    // Get the updated dependencies list for the target todo
    const newDependencies = dagManager.getParentIds(to);
  
    try {
      // Update the database with the new dependency
      await fetch(`/api/todos/${to}`, {
       method: 'PATCH',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ dependencies: newDependencies }),
     })
     .then(async response => {
        if (!response.ok) {
          // Rollback the DAG change if database update fails
          dagManager.deleteDependency(from, to);
          throw Error(await response.text());
        }
        
        // Success: clear form and refresh UI
        setSourceTodoId(null);
        setTargetTodoId(null);
        onDagUpdate();
        dagManager.calculateEarliestStartTimes(); // Recalculate earliest and latest times
     })
     .catch(error => {
        // Rollback the DAG change on error
        dagManager.deleteDependency(from, to);
        console.error('Failed to add dependency:', error);
     });
   } catch (error) {
      // Rollback the DAG change on error
      dagManager.deleteDependency(from, to);
      console.error('Failed to add dependency:', error);
   }
  };

  return (
    <div>
      {/* Toggle button to show/hide the dependency form */}
      <button
        className="w-full text-left px-4 py-2 font-bold text-gray-800 bg-gray-100 focus:outline-none rounded-lg"
        onClick={() => setShowDependencyForm((prev) => !prev)}
      >
        {showDependencyForm ? 'Hide Add Dependency' : 'Show Add Dependency'}
      </button>
      
      {/* Dependency form content - only shown when expanded */}
      {showDependencyForm && (
        <div className="p-4 space-y-2">
          {/* Source todo selection dropdown */}
          <select
            value={sourceTodoId !== null ? sourceTodoId : ''}
            onChange={(e) => {
              const num = parseToInt(e.target.value);
              setSourceTodoId(isNaN(num) ? null : num);
              setTargetTodoId(null); // Reset target when source changes to update available options
            }}
            className="w-full px-2 py-1 border rounded text-sm text-indigo-600"
          >
            <option value="">Must finish this task</option>
            {dagManager.getTodosByIds(dagManager.allTodoIds).map((node: Todo) => (
              <option key={node.id} value={node.id}>
                {node.title}
              </option>
            ))}
          </select>
          
          {/* Target todo selection dropdown - filtered to prevent cycles */}
          <select
            value={targetTodoId !== null ? targetTodoId : ''}
            onChange={(e) =>  {
              const num = parseToInt(e.target.value);
              setTargetTodoId(isNaN(num) ? null : num);
            }}
            className="w-full px-2 py-1 border rounded text-sm text-indigo-600"
            disabled={!sourceTodoId}
          >
            <option value="">Before this task</option>
            {sourceTodoId &&
              dagManager.getSafeTargets(sourceTodoId).map((nodeId: number) => {
                const node = dagManager.getTodoWithId(nodeId)!;
                return (
                  <option key={node.id} value={node.id}>
                    {node.title}
                  </option>
                );
              })}
          </select>
          
          {/* Submit button - only enabled when both todos are selected */}
          <button
            onClick={() => handleAddDependency(sourceTodoId!, targetTodoId!)}
            disabled={sourceTodoId === null || targetTodoId === null}
            className="w-full px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Add Dependency
          </button>
        </div>
      )}
    </div>
  );
} 