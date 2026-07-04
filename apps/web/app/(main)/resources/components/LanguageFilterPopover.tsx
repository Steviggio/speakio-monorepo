import React, { useState, useMemo } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { FacetItem } from "@/lib/api/resources";
import { formatLanguageLabel } from "../utils";

export function LanguageFilterPopover({
  availableLanguages,
  languageFilter,
  onSelect,
  t,
}: {
  availableLanguages: FacetItem[];
  languageFilter: string;
  onSelect: (value: string) => void;
  t: (key: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const sortedAndFiltered = useMemo(() => {
    const withLabels = availableLanguages.map((lang) => ({
      ...lang,
      label: formatLanguageLabel(lang._id),
    }));

    withLabels.sort((a, b) => a.label.localeCompare(b.label));

    if (!search.trim()) return withLabels;

    const q = search.toLowerCase();
    return withLabels.filter(
      (lang) =>
        lang.label.toLowerCase().includes(q) ||
        lang._id.toLowerCase().includes(q),
    );
  }, [availableLanguages, search]);

  const selectedLabel = languageFilter
    ? formatLanguageLabel(languageFilter)
    : (t("resources.allLanguages") || "All languages");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="h-10 min-w-45 rounded-lg border border-(--color-border) bg-white px-3 text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer flex items-center justify-between gap-2 hover:bg-bg-hover transition-colors"
      >
        <span className="truncate">{selectedLabel}</span>
        <svg className="w-4 h-4 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0 max-h-100 flex flex-col"
        align="start"
        sideOffset={6}
      >
        
        <div className="p-2 border-b border-(--color-border-light)">
          <input
            type="text"
            placeholder={t("resources.searchLanguage") || "Search language..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 rounded-md border border-(--color-border) bg-white px-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-text-muted"
            autoFocus
          />
        </div>

        <div className="overflow-y-auto max-h-[320px]">
          
          <button
            onClick={() => {
              onSelect("");
              setOpen(false);
              setSearch("");
            }}
            className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-bg-hover ${
              !languageFilter
                ? "bg-brand/5 text-brand font-medium"
                : "text-text-secondary"
            }`}
          >
            {t("resources.allLanguages") || "All languages"}
          </button>

          {sortedAndFiltered.map((lang) => (
            <button
              key={lang._id}
              onClick={() => {
                onSelect(lang._id);
                setOpen(false);
                setSearch("");
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-bg-hover flex items-center justify-between ${
                languageFilter === lang._id
                  ? "bg-brand/5 text-brand font-medium"
                  : "text-text-secondary"
              }`}
            >
              <span>{lang.label}</span>
              <span className="text-xs text-text-muted tabular-nums">
                {lang.count}
              </span>
            </button>
          ))}

          {sortedAndFiltered.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-text-muted">
              {t("resources.noLanguageMatch") || "No matching language"}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
