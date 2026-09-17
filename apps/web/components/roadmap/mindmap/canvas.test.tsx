import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoadmapMindmapCanvas } from "./RoadmapMindmapCanvas";
import { RoadmapViewSwitcher, type RoadmapViewMode } from "./RoadmapViewSwitcher";

// Mock @xyflow/react modules that require canvas or ResizeObserver in JSDOM
vi.mock("@xyflow/react", async () => {
  const actual = await vi.importActual<typeof import("@xyflow/react")>("@xyflow/react");
  return {
    ...actual,
    ReactFlow: ({ children, nodes, edges }: any) => (
      <div data-testid="react-flow-canvas" data-nodes={nodes?.length} data-edges={edges?.length}>
        {children}
      </div>
    ),
    Controls: () => <div data-testid="react-flow-controls">Controls</div>,
    MiniMap: () => <div data-testid="react-flow-minimap">MiniMap</div>,
    Background: () => <div data-testid="react-flow-background">Background</div>,
  };
});

describe("RoadmapViewSwitcher", () => {
  it("renders checklist and mindmap options and calls onViewChange on click", () => {
    const onViewChange = vi.fn();
    render(<RoadmapViewSwitcher currentView="checklist" onViewChange={onViewChange} />);

    const checklistBtn = screen.getByRole("button", { name: /checklist/i });
    const mindmapBtn = screen.getByRole("button", { name: /mindmap|carte/i });

    expect(checklistBtn).toBeDefined();
    expect(mindmapBtn).toBeDefined();

    fireEvent.click(mindmapBtn);
    expect(onViewChange).toHaveBeenCalledWith("mindmap");
  });
});

describe("RoadmapMindmapCanvas", () => {
  const sampleRoadmap = {
    _id: "test-roadmap",
    title: "Russian Mastery",
    language: "ru",
    steps: [
      {
        title: "Cyrillic Alphabet",
        completed: true,
        vocabularies: [{ front: "Привет", back: "Hello" }],
        subSteps: [],
      },
    ],
  };

  it("mounts ReactFlow canvas with controls, minimap, and computed layout nodes", () => {
    render(<RoadmapMindmapCanvas roadmap={sampleRoadmap} />);

    expect(screen.getByTestId("react-flow-canvas")).toBeDefined();
    expect(screen.getByTestId("react-flow-controls")).toBeDefined();
    expect(screen.getByTestId("react-flow-minimap")).toBeDefined();
    expect(screen.getByTestId("react-flow-background")).toBeDefined();
  });
});
