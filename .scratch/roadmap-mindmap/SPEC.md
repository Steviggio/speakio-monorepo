# Spec: Mindmap-Oriented Learning Roadmap

## Problem Statement

When learning a language or following a curriculum, users need to visualize how high-level competencies (such as Grammar, Pronunciation, Immersion, and Vocabulary) branch out into practical subtasks and milestones. Currently, users can only access their roadmaps via a flat, vertical checklist. This linear presentation conceals the broader structural progression, prevents users from gaining an intuitive high-level overview of their journey, and forces them to scroll through long lists of unrelated subtasks rather than zooming into their current area of focus.

## Solution

Provide a seamless dual-view roadmap interface allowing learners to toggle instantly between the existing checklist view and an interactive, horizontal mindmap canvas. The mindmap organizes the learning journey as a visually compelling tree: radiating from the Root Roadmap node into primary Milestones (Steps), which in turn branch into detailed tasks (SubSteps). Users can collapse finished or non-active branches to keep the visual workspace clean, navigate freely via pan and zoom controls, and click any node to open a focused side inspector drawer to manage deadlines, update statuses, and build Anki-exportable flashcards.

## User Stories

1. As a language learner, I want to switch between a checklist view and a mindmap canvas on my roadmap page, so that I can choose the presentation that fits my current mindset.
2. As a visual learner, I want my roadmap to display as a horizontal tree radiating from the roadmap title out to steps and sub-steps, so that I can intuitively understand topic hierarchy and progression.
3. As a student, I want to see the target language and overall completion progress highlighted on the root roadmap card, so that I get an instant snapshot of my overall advancement.
4. As a learner navigating a large roadmap, I want to pan across the canvas by dragging and zoom in or out using my mouse wheel or pinch gestures, so that I can inspect details or view the full curriculum.
5. As a learner, I want a persistent canvas control panel with zoom in, zoom out, and fit-to-view buttons, so that I can quickly reset my view if I lose orientation.
6. As a student with a multi-step roadmap, I want a mini-map radar in the corner of the canvas, so that I always know which quadrant of the roadmap I am currently inspecting.
7. As an organized learner, I want to collapse a step branch using an interactive toggle button, so that completed or future sub-tasks are hidden from view.
8. As a learner expanding a collapsed step branch, I want the canvas layout to recalculate and reflow dynamically, so that sibling branches never collide or leave awkward empty spaces.
9. As a busy student, I want each step card on the canvas to show its completion status, deadline indicator, and vocabulary count badge, so that I can spot upcoming deadlines and review needs at a glance.
10. As a learner focusing on a specific milestone, I want to click any step or sub-step node to open a slide-over inspector drawer on the right side of the screen, so that I can view and edit its details without leaving the canvas.
11. As a student updating my plans, I want to edit a step's title directly inside the inspector drawer, so that I can refine my learning objectives as I learn.
12. As a student completing a task, I want to check off a step or sub-step either directly on its node or within the inspector drawer, so that my progress updates immediately everywhere.
13. As a learner preparing for an upcoming exam or trip, I want to set or modify a step's target deadline with a calendar picker in the drawer, so that I stay on schedule.
14. As a language learner building my vocabulary, I want to view, add, and remove front/back word pairs inside the node's inspector drawer, so that I can compile flashcards tied to specific topics.
15. As a learner expanding my roadmap, I want to add new sub-tasks directly from the inspector drawer of a step, so that I can break complex milestones into smaller daily actions.
16. As a student cleaning up my curriculum, I want to delete obsolete steps or sub-steps from the inspector drawer with a confirmation prompt, so that I can keep my roadmap relevant.
17. As a mobile learner, I want the roadmap detail page to open in checklist view by default on small screens, so that I get a fast, touch-friendly reading experience without having to navigate a canvas immediately.
18. As a mobile learner who wants a visual overview, I want to toggle into mindmap mode on my phone and use touch gestures to pan and zoom, so that I can explore my visual roadmap on any device.
19. As a dark mode user, I want the mindmap canvas, nodes, handles, and inspector drawer to adapt to my active color theme, so that I can study comfortably at night without glare.
20. As a learner using multiple views, I want any changes made in the mindmap view (such as toggling completion or adding vocabulary) to immediately reflect when I switch back to the checklist view, so that both views remain synchronized.

## Implementation Decisions

- **Canvas Framework**: The mindmap view will be built using modern React Flow components (`@xyflow/react`), avoiding custom low-level Canvas/SVG implementations while providing built-in pan, zoom, mini-map, and custom node renderers.
- **Tree Layout Engine**: Hierarchical tree layout will be computed using `@dagrejs/dagre` configured with left-to-right (`LR`) direction. The layout operates purely on transient node and edge graph data and does not alter the backend database schema.
- **Node Classification & Composition**:
  - `Root Node`: Represents the overarching roadmap container, showing title, target language badge, and calculated overall percentage.
  - `Step Node`: Represents Level 1 milestones, containing title, completion toggle, deadline status, vocabulary counter, and an interactive `[+]` / `[-]` branch folding pill button.
  - `SubStep Node`: Represents Level 2 sub-tasks with title, check status, and vocabulary badge.
- **Interaction Model (Slide-Over Inspector)**:
  - Canvas cards remain compact and clean to avoid input/gesture conflicts during panning and zooming.
  - Clicking any node opens a right slide-over inspector sheet that houses deep editing forms (title editing, date-picker calendar, vocabulary flashcard builder, delete/add subtask buttons).
  - Background canvas remains visible and interactive while the inspector is open.
- **Branch Folding Mechanics**:
  - The collapsed/expanded state of steps is tracked in client state.
  - When a step is collapsed, its child nodes and connecting edges are omitted from the layout calculation input, and Dagre reflows the remaining graph to achieve a compact, tidy canvas.
- **Data Synchronization**:
  - The view mode (List vs. Mindmap) operates over the shared roadmap state managed in the roadmap detail page.
  - Mutations executed from the mindmap view or the slide-over inspector call existing API client routines (`apiToggleStep`, `apiUpdateStep`, `apiToggleSubStep`, `apiUpdateStepVocabularies`, etc.), ensuring full parity with the checklist view.

## Testing Decisions

- **Good Test Philosophy**: Tests must exercise user-observable behavior and computational correctness from the outside, rather than asserting internal React Flow implementation details or CSS classes.
- **Unit / Layout Seam**:
  - The tree layout transformation utility will be tested in isolation to ensure that roadmap data produces correct node ranks, directed parent-child edges, and that collapsing a step properly omits child nodes and recalculates bounding dimensions.
- **Integration / Interaction Seam**:
  - Component integration tests using `@testing-library/react` and Vitest will verify:
    - Switching between list and mindmap views displays the expected containers.
    - Clicking the branch fold toggle hides child nodes.
    - Selecting a node opens the inspector drawer with the step's information.
    - Toggling completion triggers the mutation handler and updates both visual status and progress.
- **Prior Art**: Web client Vitest tests in `apps/web` utilizing `@testing-library/react` and mocked API client calls.

## Out of Scope

- Arbitrary directed acyclic graphs (DAGs) where a substep depends on multiple parent steps (strictly single-parent tree hierarchy in this phase).
- Manual persistence of drag-and-drop coordinate positions in MongoDB (all positioning is deterministically derived via auto-layout).
- Real-time multi-user collaborative canvas editing (canvas is personal to the roadmap owner).
- Exporting the canvas as a PNG or PDF image (can be added as a separate enhancement).

## Further Notes

- The backend MongoDB roadmap models already support steps, substeps, deadlines, and vocabularies. No schema changes or database migrations are required to support this feature.
- When GitHub CLI authentication is restored (`gh auth login`), this document can be published as a tracking issue directly on `Steviggio/speakio-monorepo`.
