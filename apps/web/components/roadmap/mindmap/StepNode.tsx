import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Calendar, BookOpen, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { StepNodeData } from "./layout";

export const StepNode = memo(({ data }: NodeProps) => {
  const stepData = data as unknown as StepNodeData;

  const formattedDeadline = stepData.deadline
    ? format(new Date(stepData.deadline), "dd/MM/yyyy", { locale: fr })
    : null;

  return (
    <div
      className={`px-4 py-3 rounded-xl border bg-white dark:bg-zinc-900 shadow-sm min-w-[240px] max-w-[280px] text-left transition-all ${
        stepData.completed
          ? "border-emerald-500/50 dark:border-emerald-500/40"
          : "border-slate-200 dark:border-zinc-800"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-brand !border-2 !border-white dark:!border-zinc-900"
      />

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
            stepData.completed
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {stepData.completed ? (
            <>
              <CheckCircle2 size={12} className="text-emerald-500" />
              Terminé
            </>
          ) : (
            <>
              <Circle size={12} className="text-slate-400" />
              À faire
            </>
          )}
        </span>

        {stepData.vocabCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand dark:text-brand-light bg-brand/10 dark:bg-brand/20 px-2 py-0.5 rounded-full">
            <BookOpen size={11} />
            {stepData.vocabCount} {stepData.vocabCount > 1 ? "mots" : "mot"}
          </span>
        )}
      </div>

      <h4 className="text-sm font-semibold text-text mb-2 line-clamp-2">
        {stepData.title}
      </h4>

      {formattedDeadline && (
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted mt-1 pt-1.5 border-t border-slate-100 dark:border-zinc-800/80">
          <Calendar size={12} />
          <span>{formattedDeadline}</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-brand !border-2 !border-white dark:!border-zinc-900"
      />
    </div>
  );
});

StepNode.displayName = "StepNode";
