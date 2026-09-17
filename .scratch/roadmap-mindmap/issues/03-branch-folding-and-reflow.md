# 03: Branch Folding Ergonomics & Dynamic Dagre Reflow

**Blocked by:** 01-readonly-mindmap-canvas

**Status:** ready-for-agent

**Execution Mode:** AFK

**User Stories Covered:** 7, 8

## What to build

Deliver interactive branch folding ergonomics for Step nodes on the mindmap canvas with real-time Dagre graph layout reflow math.

From the user's perspective:
- Every Step node with one or more SubSteps features an interactive branch collapse button (`[+]` / `[-]` pill) indicating whether its branch is expanded or collapsed, including the count of collapsed subtasks.
- Clicking the collapse toggle instantly hides all child SubStep nodes and their connecting edges from the visual canvas.
- The canvas graph reflows dynamically: the Dagre tree layout engine recalculates sibling node positions on the fly so adjacent branches move together smoothly without leaving blank gaps, orphaned edges, or overlapping nodes.
- Clicking the toggle again expands the branch, smoothly restoring all child SubSteps and recalculating branch spacing.
- Collapsed states are tracked cleanly in client state and do not interfere with viewport pan/zoom position or node inspection.

## Acceptance Criteria

- [ ] Step nodes display an interactive `[+]` / `[-]` toggle pill showing collapsed state and subtask count when child nodes exist.
- [ ] Toggling a branch to collapsed hides all descendant SubStep nodes and connecting edges.
- [ ] Collapsed subtrees are omitted from the Dagre layout input, recalculating bounding box coordinates and repositioning sibling branches compactly without collisions.
- [ ] Expanding a collapsed branch recalculates layout positions and restores descendant nodes and edges.
- [ ] Branch folding maintains smooth canvas responsiveness without viewport jumping.

## Testing Seam

- **Unit / Layout Seam**: Layout calculation tests verifying:
  - Feeding a collapsed step state to the graph layout generator excludes child nodes and edges from the output graph.
  - Sibling step Y-coordinates shift upwards/closer together when a sibling branch collapses.
- **Integration / UI Seam**: Vitest + `@testing-library/react` tests asserting:
  - Clicking the branch toggle button hides child SubStep nodes from the rendered DOM.
  - Clicking again unhides them and updates the toggle icon/text.
