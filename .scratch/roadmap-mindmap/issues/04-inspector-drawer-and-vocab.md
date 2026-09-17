# 04: Slide-Over Inspector Drawer (Metadata & Vocabulary Manager)

**Blocked by:** 02-canvas-quick-actions-and-sync, 03-branch-folding-and-reflow

**Status:** ready-for-agent

**Execution Mode:** AFK

**User Stories Covered:** 10, 11, 13, 14

## What to build

Deliver a unified, responsive right slide-over inspector sheet for viewing and editing node metadata (titles, deadlines) and managing front/back flashcard vocabularies without leaving the mindmap canvas.

From the user's perspective:
- Clicking any Step or SubStep node on the mindmap canvas opens the slide-over inspector drawer on the right side of the screen.
- The canvas remains visible and interactive in the background while the inspector is open; clicking away or on a close button dismisses the drawer.
- **Metadata Editing**:
  - Learners can edit the title of the active node directly with an inline edit field, updating the canvas node label immediately upon saving.
  - Learners can set, update, or clear a milestone's target deadline using an embedded date picker calendar popover.
- **Vocabulary & Flashcard Manager**:
  - Learners can view all front/back vocabulary pairs attached to the selected Step or SubStep.
  - Learners can add new word pairs (Front / Back inputs with Add button) and remove existing pairs.
  - Vocabulary counter badges on the canvas node card increment/decrement in real time to reflect current vocabulary counts.
  - All changes trigger optimistic local updates and persist via backend API endpoints (`apiUpdateStep`, `apiUpdateSubStep`, `apiUpdateStepVocabularies`, `apiUpdateSubStepVocabularies`).

## Acceptance Criteria

- [ ] Clicking any Step or SubStep node opens the slide-over inspector drawer populated with the selected node's data.
- [ ] Editing the title in the drawer updates the node on the canvas and triggers backend persistence.
- [ ] Date picker calendar allows selecting or clearing deadlines, updating the deadline indicator on the canvas node.
- [ ] Vocabulary manager displays list of word pairs, allows adding new pairs, and allows deleting pairs.
- [ ] Vocabulary count badge on the corresponding canvas node updates dynamically when pairs are added or removed.
- [ ] Background canvas remains navigable while the drawer is open, and closing the drawer cleanly unsets selection.

## Testing Seam

- **Unit Seam**: Tests for vocabulary mutation helpers and validation logic (ensuring non-empty front/back terms).
- **Integration / UI Seam**: Vitest + `@testing-library/react` tests asserting:
  - Selecting a node opens the drawer and displays its title and deadline.
  - Updating the title invokes the update API and updates the displayed node title.
  - Adding and deleting vocabulary items calls the vocabulary API and updates the rendered list and badge count.
