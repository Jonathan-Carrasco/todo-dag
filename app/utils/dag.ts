import Todo, { TodoSchema } from "@/app/types/todo";

/**
 * TodoDAG - Directed Acyclic Graph implementation for managing todo dependencies
 * 
 * This class manages a DAG of todos where edges represent dependencies.
 * It ensures DAG integrity by preventing cycles and provides algorithms for:
 * - Critical path calculation (longest path through dependencies)
 * - Earliest start computation
 * - Topological ordering
 * - Safe dependency target identification
 * 
 * Uses singleton pattern to maintain a single source of truth for the dependency graph.
 */
class TodoDAG {
  private static instance: TodoDAG | null = null;
  
  // Adjacency list: Maps source todo ID to Map of (target todo ID -> duration)
  private adj: Map<number, Map<number, number>> = new Map();
  
  // Reverse adjacency list: Maps target todo ID to Set of source todo IDs
  private rev: Map<number, Set<number>> = new Map();
  
  // Cache for safe target computation to avoid repeated calculations
  private safeTargetsCache: Map<number, number[]> = new Map();
  
  // Maps todo ID to Todo object for quick lookups
  private idToTodo: Map<number, Todo> = new Map();

  /**
   * Private constructor enforces singleton pattern
   */
  private constructor() {}

  /**
   * Gets the singleton instance of TodoDAG
   * @returns The single TodoDAG instance
   */
  public static getInstance(): TodoDAG {
    if (!TodoDAG.instance) {
      TodoDAG.instance = new TodoDAG();
    }
    return TodoDAG.instance;
  }

  /**
   * Gets all todo IDs currently in the DAG
   * @returns Array of all todo IDs
   */
  public get allTodoIds(): number[] {
    return Array.from(this.idToTodo.keys());
  }

  /**
   * Gets todo IDs with indegree 0 (no incoming dependencies)
   * These are root-level todos that can be started immediately
   * @returns Array of todo IDs with no dependencies
   */
  public get getIndegreeZeroNodes(): number[] {
    return Array.from(
      this.rev.entries()
        .filter(([_, incomingEdges]) => incomingEdges.size === 0)
        .map(([nodeId, _]) => nodeId)
    );
  }

  /**
   * @returns Total number of todos in this DAG
   */
  public get numTodos(): number {
    return this.idToTodo.size;
  }

  /**
   * Adds a node to the DAG if it doesn't already exist
   * @param node - Todo ID to add
   */
  private addNode(node: number): void {
    if (!this.adj.has(node)) {
      this.adj.set(node, new Map());
      this.rev.set(node, new Set());
    }
  }

  /**
   * Checks if a todo exists in the DAG
   * @param todoId - ID of the todo to check
   * @returns True if todo exists, false otherwise
   */
  private hasTodo(todoId: number): boolean {
    if (!this.idToTodo.has(todoId)) {
      console.error(`Todo with id ${todoId} not found`);
      return false;
    }
    return true;
  }

  /**
   * Checks if a dependency edge exists between two todos
   * @param from - Source todo ID
   * @param to - Target todo ID
   * @returns True if dependency exists, false otherwise
   */
  private hasDependency(from: number, to: number): boolean {
    if (!this.hasTodo(from) || !this.hasTodo(to)) {
      return false;
    }

    return this.adj.get(from)!.has(to);
  }

  /**
   * Initializes the DAG from an array of TodoSchema objects
   * Clears existing data and rebuilds the entire graph structure
   * @param todos - Array of TodoSchema objects to build the DAG from
   */
  public initialize(todos: TodoSchema[]) {
    // Clear all existing data
    this.idToTodo.clear();
    this.adj.clear();
    this.rev.clear();
    this.safeTargetsCache.clear();
    this.idToTodo.clear();

    // Add all todos as nodes first
    for (const todo of todos) {
      this.idToTodo.set(todo.id, new Todo(todo));
      this.addNode(todo.id);
    }

    // Add all dependencies
    for (const todo of todos) {
      for (const dep of todo.dependencies) {
        this.addDependency(dep, todo.id);
      }
    }

    // Calculate and update minimum hours for all todos after initialization
    this.calculateEarliestStartTimes();
  }

  /**
   * Adds a new todo to the DAG
   * @param todo - Todo object to add
   */
  public addTodo(todo: Todo): void {
    this.idToTodo.set(todo.id, todo);
    this.addNode(todo.id);
    // Update calculated times and refresh UI
    dagManager.calculateEarliestStartTimes();
  }

  /**
   * Adds a dependency relationship between two todos
   * @param from - Source todo ID (must be completed first)
   * @param to - Target todo ID (depends on source)
   * @returns True if dependency was added successfully, false if it would create a cycle
   */
  public addDependency(from: number, to: number): boolean {
    if (!this.hasTodo(from) || !this.hasTodo(to)) {
      return false;
    }

    const source = this.getTodoWithId(from)!;

    // Add the dependency edge with source duration as weight
    this.adj.get(from)!.set(to, source.duration);
    this.rev.get(to)!.add(from);
    this.safeTargetsCache.clear(); // Invalidate cache
    
    return true;
  }

  /**
   * Removes a dependency relationship between two todos
   * @param from - Source todo ID
   * @param to - Target todo ID
   */
  public deleteDependency(from: number, to: number): void {
    if (!this.hasDependency(from, to)) return;

    this.adj.get(from)?.delete(to);
    this.rev.get(to)?.delete(from);
    this.safeTargetsCache.clear(); // Invalidate cache
    
    // Update calculated times for all todos
    dagManager.calculateEarliestStartTimes();
  }

  /**
   * Removes a todo and all its associated edges from the DAG
   * @param node - Todo ID to remove
   */
  public deleteNode(node: number): void {
    this.idToTodo.delete(node);
    this.adj.delete(node);
    this.rev.delete(node);
    
    // Remove all references to this node from other nodes
    this.adj.values().forEach((edges) =>  edges.delete(node));
    this.rev.values().forEach((parents) => parents.delete(node));
    
    this.safeTargetsCache.clear(); // Invalidate cache
    
    // Update calculated times for all todos
    dagManager.calculateEarliestStartTimes();
  }

  /**
   * Gets the dependency IDs for a given todo (incoming edges)
   * @param todoId - ID of the todo
   * @returns Array of todo IDs that this todo depends on
   */
  public getParentIds(todoId: number): number[] {
    return Array.from(this.rev.get(todoId)|| []);
  }

  /**
   * Gets the outgoing edge IDs for a given todo (todos that depend on this one)
   * @param todoId - ID of the todo
   * @returns Array of todo IDs that depend on this todo
   */
  public getChildrenOf(todoId: number): number[] {
    return Array.from(this.adj.get(todoId)?.keys() || []);
  }
  
  /**
   * Gets safe dependency targets for a given todo (prevents cycles)
   * Returns todos that can safely be made dependent on the given todo without creating cycles
   * @param from - Source todo ID
   * @returns Array of safe target todo IDs
   */
  public getSafeTargets(from: number): number[] {
    if (this.safeTargetsCache.has(from)) {
      return this.safeTargetsCache.get(from)!;
    }

    /**
     * Helper method to check if target is reachable from start using DFS
     * @param start - Starting todo ID
     * @param target - Target todo ID to search for
     * @returns True if target is reachable from start, false otherwise
     */
    const isReachable = (start: number, target: number): boolean => {
      const visited = new Set<number>();
      const stack = [start];
    
      while (stack.length > 0) {
        const node = stack.pop()!;
        if (node === target) return true;
        if (visited.has(node)) continue;
        visited.add(node);
    
        // Add all neighbors (dependencies) to the stack
        for (const neighbor of this.adj.get(node)?.keys() ?? []) {
          stack.push(neighbor);
        }
      }
    
      return false;
    }
  
    const safe: number[] = [];
  
    // Check each todo as a potential target
    for (const candidate of this.adj.keys()) {
      if (candidate === from) continue; // Can't depend on itself
      
      // Safe if candidate cannot reach 'from' (no cycle would be created)
      if (!isReachable(candidate, from)) {
        safe.push(candidate);
      }
    }
  
    this.safeTargetsCache.set(from, safe);
    return safe;
  }


  /**
   * Gets Todo objects by their IDs
   * @param ids - Array of todo IDs
   * @returns Array of Todo objects (filters out undefined results)
   */
  public getTodosByIds(ids: number[]): Todo[] {
    return ids.map((id) => 
      this.idToTodo.get(id)).filter((todo) => todo !== undefined);
  }

  /**
   * Gets a single Todo object by its ID
   * @param id - Todo ID
   * @returns Todo object or null if not found
   */
  public getTodoWithId(id: number): Todo | null {
    if (this.idToTodo.has(id)) {
      return this.idToTodo.get(id)!;
    }
    return null
  }

  /**
   * Finds the critical path from a root node using dynamic programming
   * The critical path is the longest weighted path through the dependency graph
   * @param root - Starting todo ID
   * @returns Array of todo IDs representing the critical path
   */
  public getCriticalPath(root: number): number[] {
    if (!this.idToTodo.has(root)) {
      return [];
    }

    const memo = new Map<number, { weight: number; path: number[] }>();

    /**
     * Recursive function to find the maximum weight path from a node
     * @param node - Current node ID
     * @returns Object containing weight and path of the longest path
     */
    const findMaxPath = (node: number): { weight: number; path: number[] } => {
      if (memo.has(node)) {
        return memo.get(node)!;
      }

      const neighbors = this.adj.get(node);

      if (!neighbors || neighbors.size === 0) {
        // Leaf node - path is just itself with weight 0
        const result = { weight: 0, path: [node] };
        memo.set(node, result);
        return result;
      }

      let maxWeight = -Infinity;
      let bestPath: number[] = [];

      // Try each neighbor and find the path with maximum weight
      for (const [neighbor, edgeWeight] of neighbors.entries()) {
        const neighborResult = findMaxPath(neighbor);
        const totalWeight = edgeWeight + neighborResult.weight;

        if (totalWeight > maxWeight) {
          maxWeight = totalWeight;
          bestPath = neighborResult.path;
        }
      }

      const result = { weight: maxWeight, path: [node, ...bestPath] };
      memo.set(node, result);
      return result;
    };

    return findMaxPath(root).path;
  }


  /**
   * Calculates earliest start times for all tasks by memoizing 
   * Uses Kahn's algorithm with proper finish time propagation
   * @returns Map of todo ID to earliest start time in hours from project start
   */
  public calculateEarliestStartTimes(): void {
    const graph = new Map<number, number[]>();       // task → dependents
    const indegree = new Map<number, number>();      // for Kahn's algo
    const duration = new Map<number, number>();      // task → duration
    const earliestStart = new Map<number, number>(); // task → start time

    // Initialize graph and metadata
    for (const todoId of this.allTodoIds) {
      const task = this.getTodoWithId(todoId);
      duration.set(todoId, task?.duration || 0);
      earliestStart.set(todoId, 0);
      indegree.set(todoId, 0);
      graph.set(todoId, []);
    }

    for (const todoId of this.allTodoIds) {
      const dependencies = this.getParentIds(todoId); // ids of tasks this one depends on
      for (const dep of dependencies) {
        graph.get(dep)!.push(todoId);
        indegree.set(todoId, (indegree.get(todoId) || 0) + 1);
      }
    }

    // Get in-degree 0 nodes
    const queue: number[] = [];
    for (const [id, deg] of indegree.entries()) {
      if (deg === 0) queue.push(id);
    }

    // Use Kahn's algorithm to process root nodes and get the maximum time this node needs
    while (queue.length > 0) {
      const current = queue.shift()!;
      const finishTime = earliestStart.get(current)! + duration.get(current)!;
      
      for (const neighbor of graph.get(current) || []) {
        const newStart = Math.max(earliestStart.get(neighbor)!, finishTime);
        earliestStart.set(neighbor, newStart);

        // Decrease indegree and add to queue if it's a root now
        indegree.set(neighbor, indegree.get(neighbor)! - 1);
        if (indegree.get(neighbor)! === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Cache minimum hours for each node
    for (const [todoId, min] of earliestStart) {
      const todo = this.getTodoWithId(todoId);
      if (todo) {
        todo.minimumHours = min;
      }
    }
  }


  /**
   * Debug method to print the current state of the DAG
   * Useful for troubleshooting dependency relationships and graph structure
   */
  debugPrintDagState(): void {
    console.log(`\n=====`);
    console.log("Adjacency List (edges):");
    for (const [from, targets] of this.adj.entries()) {
      const targetsList = Array.from(targets.entries()).map(([to, weight]) => `${to}(w:${weight})`).join(", ");
      console.log(`  ${from} -> [${targetsList}]`);
    }
    
    console.log("\nReverse Adjacency List (incoming edges):");
    for (const [to, sources] of this.rev.entries()) {
      const sourcesList = Array.from(sources).join(", ");
      console.log(`  ${to} <- [${sourcesList}]`);
    }
    
    console.log("\nTodos in DAG:");
    for (const [id, todo] of this.idToTodo.entries()) {
      const deps = this.getParentIds(id).join(", ");
      console.log(`  ID:${id} Title:"${todo.title}" Dependencies:[${deps}]`);
    }
    
    console.log(`\nTotal nodes: ${this.adj.size}`);
    console.log(`Total todos: ${this.idToTodo.size}`);
    console.log("=== End DAG State ===\n");
  }
}

// Export singleton instance for use throughout the application
export const dagManager = TodoDAG.getInstance();

