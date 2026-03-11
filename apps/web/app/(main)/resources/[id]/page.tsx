'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiGetResource, apiVote, apiGetMyVote } from '@/lib/api/resources';
import { apiToggleFavorite, apiGetFavorites } from '@/lib/api/social';
import { useAuth } from '@/lib/hooks/useAuth';
import CommentSection from '@/components/CommentSection';
import { useTranslation } from '@/lib/i18n';

interface ResourceDetail {
  _id: string; title: string; description: string; url: string; type: string;
  language: string; tags: string[]; pricing: string; positiveVotes: number;
  negativeVotes: number; submittedBy: { username: string } | null; createdAt: string;
}

export default function ResourceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const { t } = useTranslation();
  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [voteLoading, setVoteLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const fetchResource = useCallback(async () => {
    try { const data = await apiGetResource(id); setResource(data); } catch { /* */ }
    finally { setIsLoading(false); }
  }, [id]);

  const fetchMyVote = useCallback(async () => {
    if (!user) return;
    try { const data = await apiGetMyVote(id); setMyVote(data?.type || null); } catch { /* */ }
  }, [id, user]);

  const fetchFavoriteStatus = useCallback(async () => {
    if (!user) return;
    try {
      const favs = await apiGetFavorites();
      const favIds = (favs || []).map((f: any) => typeof f === 'string' ? f : f._id);
      setIsFavorited(favIds.includes(id));
    } catch { /* */ }
  }, [id, user]);

  useEffect(() => { fetchResource(); fetchMyVote(); fetchFavoriteStatus(); }, [fetchResource, fetchMyVote, fetchFavoriteStatus]);

  const handleVote = async (type: 'positive' | 'negative') => {
    if (!user || voteLoading) return;
    setVoteLoading(true);
    try { await apiVote(id, type); await fetchResource(); await fetchMyVote(); } catch { /* */ }
    finally { setVoteLoading(false); }
  };

  const handleToggleFavorite = async () => {
    if (!user || favLoading) return;
    setFavLoading(true);
    try {
      const result = await apiToggleFavorite(id);
      setIsFavorited(result.action === 'added');
    } catch { /* */ }
    finally { setFavLoading(false); }
  };

  if (isLoading) return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="animate-pulse">
        <div className="h-6 bg-[var(--color-bg-hover)] rounded w-2/3 mb-4" />
        <div className="h-4 bg-[var(--color-bg-hover)] rounded w-full mb-2" />
        <div className="h-4 bg-[var(--color-bg-hover)] rounded w-5/6" />
      </div>
    </div>
  );

  if (!resource) return (
    <div className="max-w-3xl mx-auto py-8 px-4 text-center">
      <p className="text-[var(--color-text-muted)]">{t('resources.notFound')}</p>
      <Link href="/resources" className="text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] mt-3 inline-block text-sm">{t('resources.backToCatalogue')}</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link href="/resources" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-6 inline-block">{t('resources.backToCatalogue')}</Link>

      <div className="rounded-lg border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5">
              <span>{t(`resources.types.${resource.type}`)}</span>
              <span>·</span>
              <span>{resource.language}</span>
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">{resource.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-hover)] px-2.5 py-1 rounded-md">
              {t(`resources.pricing.${resource.pricing}`)}
            </span>
          </div>
        </div>

        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-5">{resource.description}</p>

        <div className="flex items-center gap-3 mb-5">
          <a href={resource.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-sm font-medium rounded-lg transition-colors">
            {t('resources.visitResource')}
          </a>

          {/* Favorite button */}
          {user && (
            <button
              onClick={handleToggleFavorite}
              disabled={favLoading}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${isFavorited
                ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                } disabled:opacity-40`}
              title={isFavorited ? t('resources.removeFromFavorites') : t('resources.addToFavorites')}
            >
              {isFavorited ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2 2a1 1 0 011-1h10a1 1 0 011 1v13.5a.5.5 0 01-.777.416L8 12.101l-5.223 3.815A.5.5 0 012 15.5V2z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M3 2.5A1.5 1.5 0 014.5 1h7A1.5 1.5 0 0113 2.5v12l-5-3.5L3 14.5v-12z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {isFavorited ? t('resources.saved') : t('resources.save')}
            </button>
          )}
        </div>

        {resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {resource.tags.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border-light)]">{tag}</span>
            ))}
          </div>
        )}

        {/* Votes */}
        <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-border-light)]">
          <button onClick={() => handleVote('positive')} disabled={!user || voteLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm transition-colors ${myVote === 'positive' ? 'bg-green-50 border-green-200 text-green-700' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
              } disabled:opacity-40`}>
            ▲ <span className="font-medium">{resource.positiveVotes}</span>
          </button>
          <button onClick={() => handleVote('negative')} disabled={!user || voteLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm transition-colors ${myVote === 'negative' ? 'bg-red-50 border-red-200 text-red-700' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
              } disabled:opacity-40`}>
            ▼ <span className="font-medium">{resource.negativeVotes}</span>
          </button>
          {!user && <span className="text-xs text-[var(--color-text-muted)]"><Link href="/login" className="text-[var(--color-brand)]">{t('resources.loginToVote')}</Link> {t('resources.toVoteAndSave')}</span>}
        </div>

        {resource.submittedBy && (
          <div className="mt-4 pt-3 border-t border-[var(--color-border-light)] flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span>{t('resources.submittedBy')}</span>
            <span className="text-[var(--color-text)] font-medium">{resource.submittedBy.username}</span>
            <span>·</span>
            <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <CommentSection targetType="Resource" targetId={id} />
    </div>
  );
}
