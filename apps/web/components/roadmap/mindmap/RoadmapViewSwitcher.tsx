import React from "react";
import { CheckSquare, Network } from "lucide-react";

export type RoadmapViewMode = "checklist" | "mindmap";

interface RoadmapViewSwitcherProps {
  currentView: RoadmapViewMode;
  onViewChange: (view: RoadmapViewMode) => void;
}

export function RoadmapViewSwitcher({
  currentView,
  onViewChange,
}: RoadmapViewSwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Roadmap view selection"
      className="inline-flex items-center p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700"
    >
      <button
        type="button"
        onClick={() => onViewChange("checklist")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          currentView === "checklist"
            ? "bg-white dark:bg-zinc-900 text-text shadow-sm"
            : "text-text-muted hover:text-text"
        }`}
        aria-pressed={currentView === "checklist"}
      >
        <CheckSquare size={14} />
        <span>Checklist</span>
      </button>
      <button
        type="button"
        onClick={() => onViewChange("mindmap")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          currentView === "mindmap"
            ? "bg-white dark:bg-zinc-900 text-text shadow-sm"
            : "text-text-muted hover:text-text"
        }`}
        aria-pressed={currentView === "mindmap"}
      >
        <Network size={14} />
        <span>Mindmap</span>
      </button>
    </div>
  );
}
