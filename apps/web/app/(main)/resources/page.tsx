'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiGetResources } from '@/lib/api/resources';
import { useTranslation } from '@/lib/i18n';
import { ResourceType, Pricing } from '@repo/types';

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

const types = Object.values(ResourceType);
const pricing = Object.values(Pricing);

export default function ResourcesPage() {
  const { t } = useTranslation();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pricingFilter, setPricingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (pricingFilter) params.pricing = pricingFilter;
      const data = await apiGetResources(params);
      setResources(data.data || data);
      setTotalPages(data.meta?.totalPages ?? data.totalPages ?? 1);
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, [page, search, typeFilter, pricingFilter]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">{t('resources.title')}</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">{t('resources.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1"><Input
          type="text"
          placeholder={t('resources.searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-10 pb-0"
        /></div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none"
        >
          <option value="">{t('resources.allTypes')}</option>
          {types.map((k) => <option key={k} value={k}>{t(`resources.types.${k}`)}</option>)}
        </select>
        <select
          value={pricingFilter}
          onChange={(e) => { setPricingFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none"
        >
          <option value="">{t('resources.allPricing')}</option>
          {pricing.map((k) => <option key={k} value={k}>{t(`resources.pricing.${k}`)}</option>)}
        </select>
      </div>

      {/* Grid */}
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

      {/* Pagination */}
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
