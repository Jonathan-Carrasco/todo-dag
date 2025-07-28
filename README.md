## Dependency Graph

> [!IMPORTANT]  
> You will need a Pexels API key to run this application. You can sign up for a free API key at https://www.pexels.com/api/

> You will need a Postgres connection string to run this application. You can sign up for a free API key at https://www.pexels.com/api/

> Add a .env.local file at the root level directory, with POSTGRES_URL=YOUR_CONN_STRING and PEXELS_API_KEY=YOUR_API_KEY

## Development

This is a [NextJS](https://nextjs.org) app, with a PostgreSQL based backend, intended to be run with the LTS version of Node.

To run the development server:

```bash
npm i
npm run dev
```

I modeled the dependencies between todo items using a directed acyclic graph (DAG). In this graph, source nodes represent unblocked tasks, while nodes with incoming edges are dependent on the sources of those edges. To determine the earliest possible completion time for a given task, I use Kahn’s algorithm: starting from nodes with zero in-degree, I iteratively process the graph, updating each node’s earliest start time by taking the maximum of its dependencies' completion times plus their durations.

For critical path analysis, I implemented a recursive depth-first search (DFS) from the root node to find the maximum weighted path. Leaf nodes return a base case of weight 0 and a path consisting of themselves. As the DFS propagates upward, I track the longest path and cumulative weight for each node, memoizing results to avoid redundant computation when nodes are revisited from different paths.

I chose PostgreSQL to support a reverse adjacency list for modeling dependencies more efficiently. In the UI, the todo list in the top left shows root nodes with no dependencies. Expanding a todo reveals its dependent tasks. From this view, users can also query the critical path, edit the todo, or delete it. On the top right, new todos and dependencies can be added.
