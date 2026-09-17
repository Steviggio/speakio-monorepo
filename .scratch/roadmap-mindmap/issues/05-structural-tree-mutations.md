# 05: Structural Tree Mutations & Dynamic Graph Reflow

**Blocked by:** 04-inspector-drawer-and-vocab

**Status:** ready-for-agent

**Execution Mode:** AFK

**User Stories Covered:** 15, 16

## What to build

Deliver dynamic tree structure mutations (adding subtasks and deleting milestones/tasks) with confirmation safeguards and instant graph reflow.

From the user's perspective:
- Inside the Step inspector drawer, learners can add a new SubStep directly (via an inline title input and "Add Sub-task" button).
- Adding a SubStep immediately recalculates the canvas layout: a new SubStep node appears connected by a directed edge from the parent Step, and adjacent branches reflow smoothly to accommodate the new node.
- Inside any node's inspector drawer, learners can click a "Delete" action button.
- Deleting prompts a confirmation dialog/modal to prevent accidental curriculum loss.
- Upon confirmation:
  - Deleting a Step removes the step and all its child SubSteps, recalculating overall roadmap completion and reflowing remaining steps.
  - Deleting a SubStep removes the node and edge, reflowing the parent step's branch.
- Backend deletion/addition endpoints (`apiAddSubStep`, `apiRemoveSubStep`, `apiUpdateRoadmap`) persist changes, with complete state synchronization carried over to the checklist view.

## Acceptance Criteria

- [ ] "Add Sub-task" form inside Step inspector drawer creates a new SubStep and attaches it to the parent.
- [ ] New SubStep instantly renders on the canvas with directed edge, triggering Dagre layout recalculation and branch reflow.
- [ ] "Delete" button inside Step and SubStep inspector drawers opens a confirmation safeguard modal.
- [ ] Confirming deletion removes the node(s), closes the inspector drawer, updates overall roadmap progress, and reflows the canvas graph.
- [ ] All structural mutations persist to the backend and stay fully synchronized when toggling to the checklist view.

## Testing Seam

- **Unit Seam**: State reducer / tree mutation tests verifying immutable additions/removals of steps and substeps and accurate recomputation of roadmap completion metrics.
- **Integration / UI Seam**: Vitest + `@testing-library/react` tests asserting:
  - Submitting a new subtask adds the node to the graph and triggers `apiAddSubStep`.
  - Clicking delete opens the confirmation dialog.
  - Confirming deletion invokes the remove API, removes the node from the canvas DOM, and triggers layout reflow.
