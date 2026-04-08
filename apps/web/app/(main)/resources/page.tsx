'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiGetResources, apiGetResourceFacets } from '@/lib/api/resources';
import type { FacetItem } from '@/lib/api/resources';
import { useTranslation } from '@/lib/i18n';
import { RESOURCE_TYPES, PRICING_VALUES } from '@repo/types';

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

const types = Object.values(RESOURCE_TYPES);
const pricing = Object.values(PRICING_VALUES);

const DEBOUNCE_MS = 350;

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function ResourcesPage() {
  const { t } = useTranslation();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pricingFilter, setPricingFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [availableLanguages, setAvailableLanguages] = useState<FacetItem[]>([]);

  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_MS);

  const hasFetchedFacets = useRef(false);
  useEffect(() => {
    if (hasFetchedFacets.current) return;
    hasFetchedFacets.current = true;
    apiGetResourceFacets()
      .then((facets) => {
        setAvailableLanguages(Array.isArray(facets?.languages) ? facets.languages : []);
      })
      .catch(() => { /* silent — filter simply won't be populated */ });
  }, []);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      let limit = 12;
      try {
        const prefs = localStorage.getItem('speakio_preferences');
        if (prefs) {
          const parsed = JSON.parse(prefs);
          if (parsed.resourcesPerPage) limit = parsed.resourcesPerPage;
        }
      } catch { /* ignore parse error */ }

      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter) params.type = typeFilter;
      if (pricingFilter) params.pricing = pricingFilter;
      if (languageFilter) params.language = languageFilter;

      const result = await apiGetResources(params);
      const items = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : [];
      setResources(items);
      setTotalPages(Array.isArray(result) ? 1 : (result?.meta?.totalPages ?? 1));
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, [page, debouncedSearch, typeFilter, pricingFilter, languageFilter]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter, pricingFilter, languageFilter]);

  const formatLanguageLabel = (lang: string): string => {
    return lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();
  };

  const selectClasses = "h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none";

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">{t('resources.title')}</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">{t('resources.subtitle')}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1"><Input
          type="text"
          placeholder={t('resources.searchPlaceholder')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-10 pb-0"
        /></div>
        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          className={selectClasses}
        >
          <option value="">{t('resources.allLanguages')}</option>
          {availableLanguages.map((lang) => (
            <option key={lang._id} value={lang._id}>
              {formatLanguageLabel(lang._id)} ({lang.count})
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={selectClasses}
        >
          <option value="">{t('resources.allTypes')}</option>
          {types.map((k) => <option key={k} value={k}>{t(`resources.types.${k}`)}</option>)}
        </select>
        <select
          value={pricingFilter}
          onChange={(e) => setPricingFilter(e.target.value)}
          className={selectClasses}
        >
          <option value="">{t('resources.allPricing')}</option>
          {pricing.map((k) => <option key={k} value={k}>{t(`resources.pricing.${k}`)}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[var(--color-border)] bg-white p-5">
              <div className="h-4 bg-[var(--color-bg-hover)] rounded w-3/4 mb-3" />
              <div className="h-3 bg-[var(--color-bg-hover)] rounded w-full" />
            </div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <p className="text-center text-[var(--color-text-muted)] py-12">{t('resources.noResources')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r) => (
            <Link key={r._id} href={`/resources/${r._id}`} className="group rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{t(`resources.types.${r.type}`)}</span>
                <span className="text-[var(--color-border)]">·</span>
                <span className="text-xs text-[var(--color-text-muted)] uppercase">{r.language}</span>
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors mb-1.5">{r.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-3">{r.description}</p>
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                <span>{t(`resources.pricing.${r.pricing}`)}</span>
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
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t('common.previous')}
          </Button>
          <span className="text-sm text-[var(--color-text-muted)]">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
