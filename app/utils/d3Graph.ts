import { useEffect, RefObject } from 'react';
import * as d3 from 'd3';
import { formatTime, getEarliestStart, isOverdue } from '@/app/utils/dataFormatters';
import { dagManager } from '@/app/utils/dag';

interface TodoNode {
  id: number;
  title: string;
  duration: number | null; // Duration in hours
  dueDate: string; // Due date in YYYY-MM-DD format
  minimumHours: number; // Earliest possible start time in hours from project start
  imageUrl: string; // URL for the todo's image
  x: number; // X coordinate for D3 positioning
  y: number; // Y coordinate for D3 positioning
  weight: number; // Visual weight for force simulation (based on dependency count)
}

interface TodoEdge {
  source: number;
  target: number;
}

/**
 * Extracts nodes and edges from the DAG manager for D3 visualization
 * Converts todo data to D3-compatible format with positioning and weight information
 */
export const getNodesAndEdges = (): { nodes: TodoNode[], edges: TodoEdge[] } => {
  const nodes: TodoNode[] = [];
  
  const allNodes = dagManager.getTodosByIds(dagManager.allTodoIds);
  
  for (const todo of allNodes) {
    nodes.push({
      id: todo.id,
      title: todo.title,
      duration: todo.duration,
      dueDate: todo.dueDate,
      minimumHours: todo.minimumHours,
      imageUrl: todo.imageUrl,
      x: 0,
      y: 0,
      weight: dagManager.getParentIds(todo.id).length + 1, // More dependencies = more visual weight
    });
  }

  // Create edges from all dependency relationships in the DAG
  const edges: TodoEdge[] = [];
  for (const src of dagManager.allTodoIds) {
    for (const target of dagManager.getChildrenOf(src)) {
      edges.push({ source: src, target: target });
    }
  }

  return { nodes, edges };
};

/**
 * Custom React hook for D3 graph rendering and management
 * Creates an interactive force-directed graph with todo nodes and dependency edges
 * Supports critical path highlighting and drag interactions
 */
export const useD3Graph = (svgRef: RefObject<SVGSVGElement>, dagVersion: number, selectedTodoId?: number) => {
  useEffect(() => {
    const { nodes, edges } = getNodesAndEdges();
    
    // Exit early if no SVG element or no data to display
    if (!svgRef.current) {
      return;
    }

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // Calculate critical path edges for highlighting if a todo is selected
    let criticalPathEdges = new Set<string>();
    if (selectedTodoId) {
      const criticalPath = dagManager.getCriticalPath(selectedTodoId);
       
      // Create edge keys for critical path highlighting
      for (let i = 0; i < criticalPath.length - 1; i++) {
        const from = criticalPath[i];
        const to = criticalPath[i + 1];
        criticalPathEdges.add(`${from}-${to}`);
      }
    }

    const svg = d3.select(svgRef.current);
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Create D3 force simulation for physics-based layout
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(edges).id((d: any) => d.id).distance(300)) // Link force for edges
      .force("charge", d3.forceManyBody().strength(-100)) // Repulsion between nodes
      .force("center", d3.forceCenter(width / 2, height / 2)) // Center the graph
      .force("collision", d3.forceCollide().radius(150)) // Prevent node overlap
      .force("gravity", () => {
        // Custom gravity force based on node weight
        nodes.forEach((node: TodoNode) => {
          const gravityStrength = 0.1 * node.weight;
          (node as any).vy += gravityStrength;
        });
      });

    // Define arrow marker for directed edges
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 40)
      .attr("refY", 0)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#374151");

    // Create dependency edges with critical path highlighting
    const link = svg.append("g")
      .selectAll("line")
      .data(edges)
      .enter().append("line")
      .attr("stroke", (d: any) => {
        const sourceId = d.source.id || d.source;
        const targetId = d.target.id || d.target;
        const edgeKey = `${sourceId}-${targetId}`;
        const isHighlighted = criticalPathEdges.has(edgeKey);
        return isHighlighted ? "#ef4444" : "#374151"; // Red for critical path, gray otherwise
      })
      .attr("stroke-width", (d: any) => {
        const sourceId = d.source.id || d.source;
        const targetId = d.target.id || d.target;
        const edgeKey = `${sourceId}-${targetId}`;
        return criticalPathEdges.has(edgeKey) ? 4 : 3; // Thicker lines for critical path
      })
      .attr("marker-end", "url(#arrowhead)");

    // Create todo nodes with dragging capability
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .call(d3.drag<any, TodoNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Add rectangular background for each node
    node.append("rect")
      .attr("width", 180)
      .attr("height", 80)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("x", -90)
      .attr("y", -40)
      .attr("fill", "white")
      .attr("stroke", "#d1d5db")
      .attr("stroke-width", 2)
      .attr("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");

    // Todo title text
    node.append("text")
      .attr("x", 0)
      .attr("y", -25)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#374151")
      .text((d: TodoNode) => d.title);

    // Duration text
    node.append("text")
      .attr("x", 0)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#6b7280")
      .text((d: TodoNode) => d.duration ? `${d.duration} hour${d.duration > 1 ? 's' : ''}` : '');

    // Due date text with overdue highlighting
    node.append("text")
      .attr("x", 0)
      .attr("y", 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", (d: TodoNode) => isOverdue(d.dueDate) ? "#f56565" : "#6b7280")
      .text((d: TodoNode) => d.dueDate ? `Due: ${d.dueDate}` : '');

    // Earliest start time
    node.append("text")
      .attr("x", 0)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("fill", "#22c55e")
      .text((d: TodoNode) => { return getEarliestStart(d.minimumHours);
      });

    // Update positions on each simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => (d.source as TodoNode).x)
        .attr("y1", (d: any) => (d.source as TodoNode).y)
        .attr("x2", (d: any) => (d.target as TodoNode).x)
        .attr("y2", (d: any) => (d.target as TodoNode).y);

      // Update node positions with viewport
      node
        .attr("transform", (d: TodoNode) => {
          d.x = Math.max(100, Math.min(width - 100, d.x));
          d.y = Math.max(100, Math.min(height - 100, d.y));
          return `translate(${d.x},${d.y})`;
        });
    });

    /**
     * Drag event handlers for interactive node manipulation
     */
    function dragstarted(event: d3.D3DragEvent<any, TodoNode, any>, d: TodoNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      (d as any).fx = d.x;
      (d as any).fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<any, TodoNode, any>, d: TodoNode) {
      (d as any).fx = event.x;
      (d as any).fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<any, TodoNode, any>, d: TodoNode) {
      if (!event.active) simulation.alphaTarget(0);
      (d as any).fx = null;
      (d as any).fy = null;
    }

    // Cleanup function to stop simulation when component unmounts
    return () => { simulation.stop(); };
  }, [dagVersion, selectedTodoId]);
}; 