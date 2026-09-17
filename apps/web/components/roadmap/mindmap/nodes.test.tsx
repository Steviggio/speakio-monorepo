import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { RootNode } from "./RootNode";
import { StepNode } from "./StepNode";
import { SubStepNode } from "./SubStepNode";
import type { NodeProps } from "@xyflow/react";

describe("Mindmap Custom Nodes", () => {
  it("renders RootNode with title, language badge, and overall percentage progress", () => {
    const props = {
      id: "root",
      data: {
        id: "roadmap-1",
        title: "Master Japanese",
        language: "ja",
        progress: 42,
      },
    } as unknown as NodeProps;

    render(
      <ReactFlowProvider>
        <RootNode {...props} />
      </ReactFlowProvider>
    );

    expect(screen.getByText("Master Japanese")).toBeDefined();
    expect(screen.getByText("JA")).toBeDefined();
    expect(screen.getByText("42%")).toBeDefined();
  });

  it("renders StepNode with title, status pill, deadline badge, and vocabulary counter", () => {
    const props = {
      id: "step-0",
      data: {
        stepIndex: 0,
        title: "Hiragana & Katakana",
        completed: true,
        deadline: "2026-05-15",
        vocabCount: 46,
      },
    } as unknown as NodeProps;

    render(
      <ReactFlowProvider>
        <StepNode {...props} />
      </ReactFlowProvider>
    );

    expect(screen.getByText("Hiragana & Katakana")).toBeDefined();
    expect(screen.getByText("Terminé")).toBeDefined();
    expect(screen.getByText("46 mots")).toBeDefined();
    expect(screen.getByText("15/05/2026")).toBeDefined();
  });

  it("renders SubStepNode with title, completion indicator, and vocabulary counter", () => {
    const props = {
      id: "substep-0-0",
      data: {
        stepIndex: 0,
        subStepIndex: 0,
        title: "K-row syllables",
        completed: false,
        vocabCount: 5,
      },
    } as unknown as NodeProps;

    render(
      <ReactFlowProvider>
        <SubStepNode {...props} />
      </ReactFlowProvider>
    );

    expect(screen.getByText("K-row syllables")).toBeDefined();
    expect(screen.getByText("En cours")).toBeDefined();
    expect(screen.getByText("5 mots")).toBeDefined();
  });
});

