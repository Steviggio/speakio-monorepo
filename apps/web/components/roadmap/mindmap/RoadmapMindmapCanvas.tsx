"use client";

import React, { useMemo } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { RootNode } from "./RootNode";
import { StepNode } from "./StepNode";
import { SubStepNode } from "./SubStepNode";
import { getRoadmapMindmapLayout, type RoadmapMindmapData } from "./layout";

const nodeTypes: NodeTypes = {
  rootNode: RootNode,
  stepNode: StepNode,
  subStepNode: SubStepNode,
};

interface RoadmapMindmapCanvasProps {
  roadmap: RoadmapMindmapData;
}

export function RoadmapMindmapCanvas({ roadmap }: RoadmapMindmapCanvasProps) {
  const { initialNodes, initialEdges } = useMemo(() => {
    const layout = getRoadmapMindmapLayout(roadmap);
    return {
      initialNodes: layout.nodes,
      initialEdges: layout.edges,
    };
  }, [roadmap]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-[650px] min-h-[500px] border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-zinc-950 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.8}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className="opacity-60 dark:opacity-30"
        />
        <Controls
          showInteractive={false}
          className="!bg-white dark:!bg-zinc-900 !border !border-slate-200 dark:!border-zinc-800 !shadow-sm !rounded-lg overflow-hidden [&>button]:!border-b-slate-100 dark:[&>button]:!border-b-zinc-800"
        />
        <MiniMap
          zoomable
          pannable
          nodeStrokeWidth={3}
          nodeColor={(n) => {
            if (n.type === "rootNode") return "var(--color-brand, #7c3aed)";
            if (n.type === "stepNode") return "#3b82f6";
            return "#10b981";
          }}
          className="!bg-white dark:!bg-zinc-900 !border !border-slate-200 dark:!border-zinc-800 !rounded-lg !shadow-sm overflow-hidden"
        />
      </ReactFlow>
    </div>
  );
}
