import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { RootNodeData } from "./layout";

export const RootNode = memo(({ data }: NodeProps) => {
  const rootData = data as unknown as RootNodeData;

  return (
    <div className="px-4 py-3.5 rounded-xl border-2 border-brand bg-white dark:bg-zinc-900 shadow-md min-w-[240px] max-w-[280px] text-left transition-all">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="uppercase text-[11px] font-bold tracking-wider px-2 py-0.5 rounded bg-brand/10 text-brand dark:bg-brand/20">
          {rootData.language?.toUpperCase()}
        </span>
        <span className="text-xs font-semibold text-text-secondary">
          {rootData.progress}%
        </span>
      </div>
      <h3 className="text-base font-bold text-text mb-2 line-clamp-2">
        {rootData.title}
      </h3>
      <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all duration-500"
          style={{ width: `${rootData.progress}%` }}
        />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-brand !border-2 !border-white dark:!border-zinc-900"
      />
    </div>
  );
});

RootNode.displayName = "RootNode";
