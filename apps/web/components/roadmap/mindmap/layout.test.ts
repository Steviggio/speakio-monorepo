import { describe, it, expect } from "vitest";
import { getRoadmapMindmapLayout } from "./layout";

describe("Roadmap Mindmap Dagre Layout", () => {
  const sampleRoadmap = {
    _id: "roadmap-123",
    title: "Learn Spanish",
    language: "es",
    deadline: "2026-12-31",
    steps: [
      {
        title: "Basics A1",
        completed: true,
        deadline: "2026-03-01",
        vocabularies: [{ front: "hola", back: "hello" }],
        subSteps: [
          {
            title: "Greetings",
            completed: true,
            vocabularies: [{ front: "buenos dias", back: "good morning" }],
          },
          {
            title: "Numbers 1-10",
            completed: false,
            vocabularies: [],
          },
        ],
      },
      {
        title: "Grammar A2",
        completed: false,
        deadline: "2026-06-01",
        vocabularies: [],
        subSteps: [],
      },
    ],
  };

  it("computes deterministic horizontal (LR) tree layout with root, steps, and substeps", () => {
    const { nodes, edges } = getRoadmapMindmapLayout(sampleRoadmap);

    // Should have 1 root + 2 steps + 2 substeps = 5 nodes
    expect(nodes).toHaveLength(5);

    const rootNode = nodes.find((n) => n.id === "root");
    expect(rootNode).toBeDefined();
    expect(rootNode?.type).toBe("rootNode");
    expect(rootNode?.data).toMatchObject({
      title: "Learn Spanish",
      language: "es",
      progress: 50, // 1 of 2 steps completed
    });

    const step0Node = nodes.find((n) => n.id === "step-0");
    const step1Node = nodes.find((n) => n.id === "step-1");
    expect(step0Node?.type).toBe("stepNode");
    expect(step0Node?.data).toMatchObject({
      stepIndex: 0,
      title: "Basics A1",
      completed: true,
      deadline: "2026-03-01",
      vocabCount: 1,
    });

    const subStep00Node = nodes.find((n) => n.id === "substep-0-0");
    const subStep01Node = nodes.find((n) => n.id === "substep-0-1");
    expect(subStep00Node?.type).toBe("subStepNode");
    expect(subStep00Node?.data).toMatchObject({
      stepIndex: 0,
      subStepIndex: 0,
      title: "Greetings",
      completed: true,
      vocabCount: 1,
    });

    // Verify left-to-right (LR) hierarchy: root.x < step.x < substep.x
    expect(rootNode!.position.x).toBeLessThan(step0Node!.position.x);
    expect(step0Node!.position.x).toBeLessThan(subStep00Node!.position.x);
    expect(step0Node!.position.x).toBeLessThan(subStep01Node!.position.x);

    // Verify edges: root -> steps, step -> substeps
    expect(edges).toContainEqual(
      expect.objectContaining({
        id: "e-root-step-0",
        source: "root",
        target: "step-0",
      })
    );
    expect(edges).toContainEqual(
      expect.objectContaining({
        id: "e-root-step-1",
        source: "root",
        target: "step-1",
      })
    );
    expect(edges).toContainEqual(
      expect.objectContaining({
        id: "e-step-0-substep-0-0",
        source: "step-0",
        target: "substep-0-0",
      })
    );
    expect(edges).toContainEqual(
      expect.objectContaining({
        id: "e-step-0-substep-0-1",
        source: "step-0",
        target: "substep-0-1",
      })
    );
  });

  it("handles empty steps gracefully", () => {
    const emptyRoadmap = {
      _id: "roadmap-empty",
      title: "Empty Roadmap",
      language: "en",
      steps: [],
    };

    const { nodes, edges } = getRoadmapMindmapLayout(emptyRoadmap);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.id).toBe("root");
    expect(nodes[0]?.data.progress).toBe(0);
    expect(edges).toHaveLength(0);
  });
});
