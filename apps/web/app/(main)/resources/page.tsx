"use client";

import React, { Suspense, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiGetResources, apiGetResourceFacets } from "@/lib/api/resources";
import type { FacetItem } from "@/lib/api/resources";
import { useTranslation } from "@/lib/i18n";

interface ResourceItem {
  _id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  language: string;
  tags: string[];
  pricing: string;
  positiveVotes: number;
  negativeVotes: number;
}

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

  // Init from URL params
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "");
  const [pricingFilter, setPricingFilter] = useState(searchParams.get("pricing") || "");
  const [languageFilter, setLanguageFilter] = useState(searchParams.get("language") || "");
  const [sortFilter, setSortFilter] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);

  // Dynamic facets from DB
  const [availableTypes, setAvailableTypes] = useState<FacetItem[]>([]);
  const [availablePricing, setAvailablePricing] = useState<FacetItem[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<FacetItem[]>([]);

  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_MS);

  // Fetch facets once on mount
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

  // Sync filters to URL
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
      let limit = 12;
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

  const formatLanguageLabel = (lang: string): string => {
    const languageNames: Record<string, string> = {
      en: "English",
      fr: "Français",
      es: "Español",
      de: "Deutsch",
      it: "Italiano",
      pt: "Português",
      ar: "العربية",
      zh: "中文",
      ja: "日本語",
      ko: "한국어",
      ru: "Русский",
      nl: "Nederlands",
      sv: "Svenska",
      no: "Norsk",
      da: "Dansk",
      fi: "Suomi",
      pl: "Polski",
      cs: "Čeština",
      tr: "Türkçe",
      el: "Ελληνικά",
      he: "עברית",
      hi: "हिन्दी",
      th: "ไทย",
      vi: "Tiếng Việt",
      uk: "Українська",
      ro: "Română",
      hu: "Magyar",
      ca: "Català",
      is: "Íslenska",
      multi: "Multilingual",
    };
    return languageNames[lang] || lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();
  };

  const formatTypeLabel = (type: string): string => {
    return t(`resources.types.${type}`) || type;
  };

  const formatPricingLabel = (pricing: string): string => {
    return t(`resources.pricing.${pricing}`) || pricing;
  };

  const selectClasses =
    "h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none cursor-pointer";

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
          {t("resources.title")}
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          {t("resources.subtitle")}
        </p>
      </div>

      {/* Filters row */}
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
        <select
          id="language-filter"
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className={selectClasses}
        >
          <option value="">{t("resources.allLanguages")}</option>
          {availableLanguages.map((lang) => (
            <option key={lang._id} value={lang._id}>
              {formatLanguageLabel(lang._id)} ({lang.count})
            </option>
          ))}
        </select>
        <select
          id="type-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={selectClasses}
        >
          <option value="">{t("resources.allTypes")}</option>
          {availableTypes.map((facet) => (
            <option key={facet._id} value={facet._id}>
              {formatTypeLabel(facet._id)} ({facet.count})
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
              {formatPricingLabel(facet._id)} ({facet.count})
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-[var(--color-border)] bg-white p-5"
            >
              <div className="h-3 bg-[var(--color-bg-hover)] rounded w-1/3 mb-3" />
              <div className="h-4 bg-[var(--color-bg-hover)] rounded w-3/4 mb-3" />
              <div className="h-3 bg-[var(--color-bg-hover)] rounded w-full mb-2" />
              <div className="h-3 bg-[var(--color-bg-hover)] rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <p className="text-center text-[var(--color-text-muted)] py-12">
          {t("resources.noResources")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r) => (
            <Link
              key={r._id}
              href={`/resources/${r._id}`}
              className="group rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  {formatTypeLabel(r.type)}
                </span>
                <span className="text-[var(--color-border)]">·</span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {formatLanguageLabel(r.language)}
                </span>
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors mb-1.5">
                {r.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-3">
                {r.description}
              </p>
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                <span>{formatPricingLabel(r.pricing)}</span>
                <div className="flex items-center gap-3">
                  <span>▲ {r.positiveVotes}</span>
                  <span>▼ {r.negativeVotes}</span>
                </div>
              </div>
            </Link>
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
          <span className="text-sm text-[var(--color-text-muted)]">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[var(--color-border)] bg-white p-5">
              <div className="h-3 bg-[var(--color-bg-hover)] rounded w-1/3 mb-3" />
              <div className="h-4 bg-[var(--color-bg-hover)] rounded w-3/4 mb-3" />
              <div className="h-3 bg-[var(--color-bg-hover)] rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    }>
      <ResourcesContent />
    </Suspense>
  );
}
