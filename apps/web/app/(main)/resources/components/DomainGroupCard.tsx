import React, { useState } from "react";
import Link from "next/link";
import { DomainGroup, formatTypeLabel, formatLanguageLabel, formatPricingLabel } from "../utils";

export function DomainGroupCard({
  group,
  t,
}: {
  group: DomainGroup;
  t: (key: string) => string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMultiple = group.resources.length > 1;
  const preview = group.resources[0];

  if (!preview) {
    return null;
  }

  if (!hasMultiple) {
    return (
      <Link
        href={`/resources/${preview._id}`}
        className="group rounded-lg border border--(--color-border) bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {formatTypeLabel(preview.type, t)}
          </span>
          <span className="text--(--color-border)">·</span>
          <span className="text-xs text-text-muted">
            {formatLanguageLabel(preview.language)}
          </span>
        </div>
        <h3 className="text-base font-semibold text--(--color-text) group-hover:text-brand transition-colors mb-1.5">
          {preview.title}
        </h3>
        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
          {preview.description}
        </p>
        <div className="flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-bg-hover text-[10px] font-medium text-text-muted">
              {group.label}
            </span>
            <span>{formatPricingLabel(preview.pricing, t)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>▲ {preview.positiveVotes}</span>
            <span>▼ {preview.negativeVotes}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border--(--color-border) bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-5 flex items-start justify-between gap-3 hover:bg-bg-hover/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-semibold">
              {group.label}
            </span>
            <span className="text-xs text-text-muted">
              {group.resources.length} {t("resources.resourceCount") || "resources"}
            </span>
          </div>
          <h3 className="text-base font-semibold text--(--color-text) mb-1">
            {preview.title}
          </h3>
          <p className="text-sm text-text-secondary line-clamp-2">
            {preview.description}
          </p>
        </div>
        <div className="flex-shrink-0 mt-1">
          <svg
            className={`w-5 h-5 text-text-muted transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border-light">
          {group.resources.map((r, idx) => (
            <Link
              key={r._id}
              href={`/resources/${r._id}`}
              className={`block px-5 py-3.5 hover:bg-bg-hover transition-colors ${
                idx < group.resources.length - 1 ? "border-b border-border-light" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                  {formatTypeLabel(r.type, t)}
                </span>
                <span className="text--(--color-border)">·</span>
                <span className="text-[10px] text-text-muted">
                  {formatLanguageLabel(r.language)}
                </span>
              </div>
              <h4 className="text-sm font-medium text--(--color-text) hover:text-brand transition-colors">
                {r.title}
              </h4>
              {r.description && (
                <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">
                  {r.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-1.5 text-[10px] text-text-muted">
                <span>{formatPricingLabel(r.pricing, t)}</span>
                <div className="flex items-center gap-2">
                  <span>▲ {r.positiveVotes}</span>
                  <span>▼ {r.negativeVotes}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
