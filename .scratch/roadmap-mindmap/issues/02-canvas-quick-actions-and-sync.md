# 02: Direct Canvas Quick-Actions & Live View Synchronization

**Blocked by:** 01-readonly-mindmap-canvas

**Status:** ready-for-agent

**Execution Mode:** AFK

**User Stories Covered:** 9, 12, 20

## What to build

Deliver direct in-canvas interactive completion actions and bidirectional real-time state synchronization between the checklist and mindmap views.

From the user's perspective:
- Learners can click checkboxes/completion toggles directly on any Step or SubStep node card in the mindmap canvas to toggle its completion state.
- Toggling completion instantly reflects on the node's visual style (strikethrough/accent styling, status pill changes).
- The overall completion percentage on the Root Roadmap card recalculates immediately when any step or substep completion status changes.
- Optimistic UI updates update the interface immediately while triggering the corresponding backend API mutations (`apiToggleStep`, `apiToggleSubStep`), with error rollback if network requests fail.
- Switching between Mindmap and Checklist views guarantees 100% state parity: items marked complete in mindmap mode are immediately reflected when toggling back to checklist mode and vice versa without requiring a page reload.

## Acceptance Criteria

- [ ] Interactive completion toggle on Step nodes updates step completion status and triggers backend mutation.
- [ ] Interactive completion checkbox on SubStep nodes updates substep completion status and triggers backend mutation.
- [ ] Root node overall progress bar and percentage value dynamically update on any status toggle.
- [ ] Mutations apply optimistically in client state and rollback cleanly if the API returns an error.
- [ ] Switching between checklist and mindmap views preserves identical completion states across all steps and substeps.

## Testing Seam

- **Unit Seam**: State reducer / roadmap synchronization hook tests verifying progress calculation and optimistic state updates on step/substep toggle actions.
- **Integration / UI Seam**: Vitest + `@testing-library/react` tests asserting:
  - Clicking completion toggle on a Step or SubStep node card invokes the respective API toggle handler.
  - Root node calculated percentage re-renders with the updated percentage.
  - Toggling an item in mindmap view and switching view mode shows the item checked in checklist view.
