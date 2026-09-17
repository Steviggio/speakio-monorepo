import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { BookOpen, CheckCircle2, Circle } from "lucide-react";
import type { SubStepNodeData } from "./layout";

export const SubStepNode = memo(({ data }: NodeProps) => {
  const subStepData = data as unknown as SubStepNodeData;

  return (
    <div
      className={`px-3.5 py-2.5 rounded-lg border bg-white dark:bg-zinc-900 shadow-sm min-w-[200px] max-w-[260px] text-left transition-all ${
        subStepData.completed
          ? "border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10"
          : "border-slate-200 dark:border-zinc-800"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-brand !border-2 !border-white dark:!border-zinc-900"
      />

      <div className="flex items-center justify-between gap-2 mb-1">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
            subStepData.completed
              ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
              : "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40"
          }`}
        >
          {subStepData.completed ? (
            <>
              <CheckCircle2 size={10} className="text-emerald-500" />
              Terminé
            </>
          ) : (
            <>
              <Circle size={10} className="text-amber-500" />
              En cours
            </>
          )}
        </span>

        {subStepData.vocabCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-brand dark:text-brand-light bg-brand/10 dark:bg-brand/20 px-1.5 py-0.5 rounded">
            <BookOpen size={10} />
            {subStepData.vocabCount} {subStepData.vocabCount > 1 ? "mots" : "mot"}
          </span>
        )}
      </div>

      <h5 className="text-xs font-medium text-text line-clamp-2">
        {subStepData.title}
      </h5>
    </div>
  );
});

SubStepNode.displayName = "SubStepNode";
