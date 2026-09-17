# 01: Read-Only Interactive Mindmap Canvas & View Switcher

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Execution Mode:** AFK

**User Stories Covered:** 1, 2, 3, 4, 5, 6, 17, 18, 19

## What to build

Deliver a complete, working dual-view roadmap interface that allows learners to switch between the existing checklist view and an interactive, horizontal mindmap canvas.

From the user's perspective:
- A responsive view toggle at the top of the roadmap page lets learners swap instantly between Checklist and Mindmap modes.
- On small screens/mobile, the view defaults to the checklist view, but learners can switch to the mindmap view at any time.
- The mindmap renders the entire roadmap hierarchy as a left-to-right (`LR`) tree layout radiating from the Root Roadmap node into Step cards and child SubStep cards.
- **Root Node**: displays roadmap title, target language badge, and overall percentage progress.
- **Step Node**: displays step title, completion status pill, deadline badge, and vocabulary counter badge.
- **SubStep Node**: displays substep title, completion indicator, and vocabulary counter badge.
- Learners can freely pan across the canvas via dragging/touch, zoom with mouse-wheel or pinch gestures, inspect orientation using a corner Mini-Map radar, and recenter/zoom with a floating controls toolbar (Zoom In, Zoom Out, Fit View).
- Dark mode theme compatibility across the canvas background grid, node cards, and controls.

## Acceptance Criteria

- [ ] View toggle button switchable between Checklist and Mindmap views in the roadmap header.
- [ ] Defaults to Checklist view on mobile viewports and preserves current roadmap state across view switches.
- [ ] Pure Dagre layout engine calculates deterministic node positions (`(x, y)`) and directed edges (`source -> target`) in left-to-right hierarchy.
- [ ] Renders custom React Flow node cards for Root, Step, and SubStep with accurate titles, status badges, deadlines, and vocabulary counts.
- [ ] React Flow canvas includes working pan, zoom, `<Controls />` panel (Zoom In/Out, Fit-to-view), and corner `<MiniMap />`.
- [ ] Canvas, node cards, handles, and controls seamlessly adapt to dark and light mode themes.

## Testing Seam

- **Unit / Layout Seam**: Test the graph layout computation in isolation with sample roadmap data to verify node positioning coordinates, rank assignments, and parent-to-child edge connectivity.
- **Integration / UI Seam**: Vitest + `@testing-library/react` tests asserting:
  - Toggle switches between Checklist and Canvas containers.
  - Root, Step, and SubStep nodes render expected textual contents and badges.
  - Pan/zoom controls and mini-map components are mounted and rendered inside the canvas.
