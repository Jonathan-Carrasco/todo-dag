## Soma Capital Technical Assessment

This is a technical assessment as part of the interview process for Soma Capital.

> [!IMPORTANT]  
> You will need a Pexels API key to complete the technical assessment portion of the application. You can sign up for a free API key at https://www.pexels.com/api/

To begin, clone this repository to your local machine.

## Development

This is a [NextJS](https://nextjs.org) app, with a SQLite based backend, intended to be run with the LTS version of Node.

To run the development server:

```bash
npm i
npm run dev
```

## Task:

Modify the code to add support for due dates, image previews, and task dependencies.

### Part 1: Due Dates

When a new task is created, users should be able to set a due date.

When showing the task list is shown, it must display the due date, and if the date is past the current time, the due date should be in red.

### Part 2: Image Generation

When a todo is created, search for and display a relevant image to visualize the task to be done.

To do this, make a request to the [Pexels API](https://www.pexels.com/api/) using the task description as a search query. Display the returned image to the user within the appropriate todo item. While the image is being loaded, indicate a loading state.

You will need to sign up for a free Pexels API key to make the fetch request.

### Part 3: Task Dependencies

Implement a task dependency system that allows tasks to depend on other tasks. The system must:

1. Allow tasks to have multiple dependencies
2. Prevent circular dependencies
3. Show the critical path
4. Calculate the earliest possible start date for each task based on its dependencies
5. Visualize the dependency graph

## Submission:

1. Add a new "Solution" section to this README with a description and screenshot or recording of your solution.
2. Push your changes to a public GitHub repository.
3. Submit a link to your repository in the application form.

Thanks for your time and effort. We'll be in touch soon!

## Solution

I modeled the dependencies between todo items using a directed acyclic graph (DAG). In this graph, source nodes represent unblocked tasks, while nodes with incoming edges are dependent on the sources of those edges. To determine the earliest possible completion time for a given task, I use Kahn’s algorithm: starting from nodes with zero in-degree, I iteratively process the graph, updating each node’s earliest start time by taking the maximum of its dependencies' completion times plus their durations.

For critical path analysis, I implemented a recursive depth-first search (DFS) from the root node to find the maximum weighted path. Leaf nodes return a base case of weight 0 and a path consisting of themselves. As the DFS propagates upward, I track the longest path and cumulative weight for each node, memoizing results to avoid redundant computation when nodes are revisited from different paths.

I chose PostgreSQL over SQLite to support a reverse adjacency list for modeling dependencies more efficiently, as SQLite lacks this feature. In the UI, the todo list in the top left shows root nodes with no dependencies. Expanding a todo reveals its dependent tasks. From this view, users can also query the critical path, edit the todo, or delete it. On the top right, new todos and dependencies can be added.

I used Cursor to auto-generate comments in the code—apologies if it got a bit verbose. I hope you enjoy the solution and would love the chance to discuss it further. I attached images of the UI in the images folder. Please let me know if you have any questions!
