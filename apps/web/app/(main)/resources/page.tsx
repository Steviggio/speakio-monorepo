"use client";

import React, { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { apiGetResources, apiGetResourceFacets } from "@/lib/api/resources";
import type { FacetItem, ResourceItem } from "@/lib/api/resources";
import { useTranslation } from "@/lib/i18n";
import { DomainGroupCard } from "./components/DomainGroupCard";
import { LanguageFilterPopover } from "./components/LanguageFilterPopover";

import { DomainGroup, extractRootDomain, domainToLabel, groupByDomain, formatLanguageLabel, formatTypeLabel, formatPricingLabel } from "./utils";

const DEBOUNCE_MS = 350;

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function ResourcesContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "");
  const [pricingFilter, setPricingFilter] = useState(searchParams.get("pricing") || "");
  const [languageFilter, setLanguageFilter] = useState(searchParams.get("language") || "");
  const [sortFilter, setSortFilter] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);

  const [availableTypes, setAvailableTypes] = useState<FacetItem[]>([]);
  const [availablePricing, setAvailablePricing] = useState<FacetItem[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<FacetItem[]>([]);

  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_MS);

  const hasFetchedFacets = useRef(false);
  useEffect(() => {
    if (hasFetchedFacets.current) return;
    hasFetchedFacets.current = true;
    apiGetResourceFacets()
      .then((facets) => {
        setAvailableTypes(
          Array.isArray(facets?.types) ? facets.types : [],
        );
        setAvailablePricing(
          Array.isArray(facets?.pricing) ? facets.pricing : [],
        );
        setAvailableLanguages(
          Array.isArray(facets?.languages) ? facets.languages : [],
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (typeFilter) params.set("type", typeFilter);
    if (pricingFilter) params.set("pricing", pricingFilter);
    if (languageFilter) params.set("language", languageFilter);
    if (sortFilter && sortFilter !== "newest") params.set("sort", sortFilter);
    if (page > 1) params.set("page", String(page));

    const qs = params.toString();
    router.replace(`/resources${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [debouncedSearch, typeFilter, pricingFilter, languageFilter, sortFilter, page, router]);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      let limit = 24;
      try {
        const prefs = localStorage.getItem("speakio_preferences");
        if (prefs) {
          const parsed = JSON.parse(prefs);
          if (parsed.resourcesPerPage) limit = parsed.resourcesPerPage;
        }
      } catch {}

      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter) params.type = typeFilter;
      if (pricingFilter) params.pricing = pricingFilter;
      if (languageFilter) params.language = languageFilter;
      if (sortFilter) params.sort = sortFilter;

      const result = await apiGetResources(params);
      const items = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];
      setResources(items);
      setTotalPages(
        Array.isArray(result) ? 1 : (result?.meta?.totalPages ?? 1),
      );
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, pricingFilter, languageFilter, sortFilter]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, pricingFilter, languageFilter, sortFilter]);

  const domainGroups = useMemo(() => groupByDomain(resources), [resources]);

  const selectClasses =
    "h-10 rounded-lg border border--(--color-border) bg-white px-3 text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand/30 appearance-none cursor-pointer";

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text--(--color-text) tracking-tight">
          {t("resources.title")}
        </h1>
        <p className="text-text-secondary mt-1">
          {t("resources.subtitle")}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={t("resources.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 pb-0"
          />
        </div>
        <LanguageFilterPopover
          availableLanguages={availableLanguages}
          languageFilter={languageFilter}
          onSelect={setLanguageFilter}
          t={t}
        />
        <select
          id="type-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={selectClasses}
        >
          <option value="">{t("resources.allTypes")}</option>
          {availableTypes.map((facet) => (
            <option key={facet._id} value={facet._id}>
              {formatTypeLabel(facet._id, t)} ({facet.count})
            </option>
          ))}
        </select>
        <select
          id="pricing-filter"
          value={pricingFilter}
          onChange={(e) => setPricingFilter(e.target.value)}
          className={selectClasses}
        >
          <option value="">{t("resources.allPricing")}</option>
          {availablePricing.map((facet) => (
            <option key={facet._id} value={facet._id}>
              {formatPricingLabel(facet._id, t)} ({facet.count})
            </option>
          ))}
        </select>
        <select
          id="sort-filter"
          value={sortFilter}
          onChange={(e) => setSortFilter(e.target.value)}
          className={selectClasses}
        >
          <option value="newest">{t("resources.sortNewest")}</option>
          <option value="oldest">{t("resources.sortOldest")}</option>
          <option value="popular">{t("resources.sortPopular")}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border--(--color-border) bg-white p-5"
            >
              <div className="h-3 bg-bg-hover rounded w-1/3 mb-3" />
              <div className="h-4 bg-bg-hover rounded w-3/4 mb-3" />
              <div className="h-3 bg-bg-hover rounded w-full mb-2" />
              <div className="h-3 bg-bg-hover rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : domainGroups.length === 0 ? (
        <p className="text-center text-text-muted py-12">
          {t("resources.noResources")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {domainGroups.map((group) => (
            <DomainGroupCard
              key={group.domain}
              group={group}
              t={t}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            {t("common.previous")}
          </Button>
          <span className="text-sm text-text-muted">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            {t("common.next")}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border--(--color-border) bg-white p-5">
              <div className="h-3 bg-bg-hover rounded w-1/3 mb-3" />
              <div className="h-4 bg-bg-hover rounded w-3/4 mb-3" />
              <div className="h-3 bg-bg-hover rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    }>
      <ResourcesContent />
    </Suspense>
  );
}
