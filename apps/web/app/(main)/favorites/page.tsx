'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiGetFavorites, apiToggleFavorite } from '@/lib/api/social';
import { useTranslation } from '@/lib/i18n';

interface FavoriteResource {
  _id: string; title: string; description: string; url: string;
  type: string; language: string; pricing: string;
  positiveVotes: number; negativeVotes: number;
}

const typeLabels: Record<string, string> = { BOOK: 'Book', AUDIO: 'Audio', VIDEO: 'Video', APP: 'App', CHAT: 'Chat', ARTICLE: 'Article', WEBSITE: 'Website' };

export default function FavoritesPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<FavoriteResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try { const data = await apiGetFavorites(); setFavorites(data); }
      catch { /* */ } finally { setIsLoading(false); }
    };
    fetch();
  }, [user]);

  const handleRemove = async (resourceId: string) => {
    try { await apiToggleFavorite(resourceId); setFavorites((prev) => prev.filter((r) => r._id !== resourceId)); }
    catch { /* */ }
  };

  if (!user) return (
    <div className="max-w-4xl mx-auto py-16 px-4 text-center">
      <p className="text-[var(--color-text-muted)]"><Link href="/login" className="text-[var(--color-brand)]">{t('nav.login')}</Link> {t('favorites.loginToSee').replace('Log in', '')}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight mb-1">{t('favorites.title')}</h1>
      <p className="text-[var(--color-text-secondary)] mb-6">{t('favorites.subtitle')}</p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[var(--color-border)] bg-white p-5">
              <div className="h-4 bg-[var(--color-bg-hover)] rounded w-3/4 mb-3" />
              <div className="h-3 bg-[var(--color-bg-hover)] rounded w-full" />
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--color-text-muted)] mb-3">{t('favorites.noFavorites')}</p>
          <Link href="/resources" className="text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] text-sm font-medium">{t('favorites.browseResources')}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((resource) => (
            <div key={resource._id} className="rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-sm group">
              <div className="flex items-start justify-between mb-2">
                <Link href={`/resources/${resource._id}`} className="hover:text-[var(--color-brand)] transition-colors">
                  <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">{t(`resources.types.${resource.type}`) || resource.type}</div>
                  <h3 className="text-base font-semibold text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors">{resource.title}</h3>
                </Link>
                <button onClick={() => handleRemove(resource._id)} className="text-xs text-[var(--color-text-muted)] hover:text-red-500 transition-colors px-1" title={t('favorites.remove')}>✕</button>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-3">{resource.description}</p>
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                <span>▲ {resource.positiveVotes}</span>
                <span>▼ {resource.negativeVotes}</span>
                <span className="uppercase ml-auto">{resource.language}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
