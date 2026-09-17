import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";

export interface RoadmapMindmapVocabulary {
  front: string;
  back: string;
}

export interface RoadmapMindmapSubStep {
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  deadline?: string;
  vocabularies?: RoadmapMindmapVocabulary[];
}

export interface RoadmapMindmapStep {
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  deadline?: string;
  vocabularies?: RoadmapMindmapVocabulary[];
  subSteps?: RoadmapMindmapSubStep[];
}

export interface RoadmapMindmapData {
  _id: string;
  title: string;
  description?: string;
  language: string;
  deadline?: string;
  steps: RoadmapMindmapStep[];
}

export interface RootNodeData {
  [key: string]: unknown;
  id: string;
  title: string;
  language: string;
  progress: number;
  deadline?: string;
}

export interface StepNodeData {
  [key: string]: unknown;
  stepIndex: number;
  title: string;
  completed: boolean;
  deadline?: string;
  vocabCount: number;
}

export interface SubStepNodeData {
  [key: string]: unknown;
  stepIndex: number;
  subStepIndex: number;
  title: string;
  completed: boolean;
  deadline?: string;
  vocabCount: number;
}

const ROOT_NODE_WIDTH = 260;
const ROOT_NODE_HEIGHT = 110;

const STEP_NODE_WIDTH = 260;
const STEP_NODE_HEIGHT = 120;

const SUBSTEP_NODE_WIDTH = 240;
const SUBSTEP_NODE_HEIGHT = 90;

export function getRoadmapMindmapLayout(roadmap: RoadmapMindmapData): {
  nodes: Node[];
  edges: Edge[];
} {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "LR",
    nodesep: 30,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const completedSteps = (roadmap.steps || []).filter((s) => s.completed).length;
  const progress =
    roadmap.steps && roadmap.steps.length > 0
      ? Math.round((completedSteps / roadmap.steps.length) * 100)
      : 0;

  // Root node
  const rootNodeId = "root";
  g.setNode(rootNodeId, { width: ROOT_NODE_WIDTH, height: ROOT_NODE_HEIGHT });
  nodes.push({
    id: rootNodeId,
    type: "rootNode",
    position: { x: 0, y: 0 },
    data: {
      id: roadmap._id,
      title: roadmap.title,
      language: roadmap.language,
      progress,
      deadline: roadmap.deadline,
    } satisfies RootNodeData,
  });

  (roadmap.steps || []).forEach((step, stepIndex) => {
    const stepNodeId = `step-${stepIndex}`;
    g.setNode(stepNodeId, { width: STEP_NODE_WIDTH, height: STEP_NODE_HEIGHT });
    nodes.push({
      id: stepNodeId,
      type: "stepNode",
      position: { x: 0, y: 0 },
      data: {
        stepIndex,
        title: step.title,
        completed: step.completed,
        deadline: step.deadline,
        vocabCount: step.vocabularies?.length || 0,
      } satisfies StepNodeData,
    });

    const edgeRootToStep: Edge = {
      id: `e-root-step-${stepIndex}`,
      source: rootNodeId,
      target: stepNodeId,
      type: "smoothstep",
      animated: !step.completed,
      style: {
        stroke: step.completed ? "var(--color-brand, #7c3aed)" : "var(--color-border, #cbd5e1)",
        strokeWidth: 2,
      },
    };
    edges.push(edgeRootToStep);
    g.setEdge(rootNodeId, stepNodeId);

    (step.subSteps || []).forEach((subStep, subStepIndex) => {
      const subStepNodeId = `substep-${stepIndex}-${subStepIndex}`;
      g.setNode(subStepNodeId, {
        width: SUBSTEP_NODE_WIDTH,
        height: SUBSTEP_NODE_HEIGHT,
      });
      nodes.push({
        id: subStepNodeId,
        type: "subStepNode",
        position: { x: 0, y: 0 },
        data: {
          stepIndex,
          subStepIndex,
          title: subStep.title,
          completed: subStep.completed,
          deadline: subStep.deadline,
          vocabCount: subStep.vocabularies?.length || 0,
        } satisfies SubStepNodeData,
      });

      const edgeStepToSubStep: Edge = {
        id: `e-step-${stepIndex}-substep-${stepIndex}-${subStepIndex}`,
        source: stepNodeId,
        target: subStepNodeId,
        type: "smoothstep",
        animated: !subStep.completed,
        style: {
          stroke: subStep.completed ? "var(--color-brand, #7c3aed)" : "var(--color-border, #cbd5e1)",
          strokeWidth: 2,
        },
      };
      edges.push(edgeStepToSubStep);
      g.setEdge(stepNodeId, subStepNodeId);
    });
  });

  dagre.layout(g);

  // Transfer dagre computed x, y (which are center points) to top-left positions for React Flow
  const positionedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    const nodeWidth =
      node.type === "rootNode"
        ? ROOT_NODE_WIDTH
        : node.type === "stepNode"
          ? STEP_NODE_WIDTH
          : SUBSTEP_NODE_WIDTH;
    const nodeHeight =
      node.type === "rootNode"
        ? ROOT_NODE_HEIGHT
        : node.type === "stepNode"
          ? STEP_NODE_HEIGHT
          : SUBSTEP_NODE_HEIGHT;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return {
    nodes: positionedNodes,
    edges,
  };
}
