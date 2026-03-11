'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiGetPosts } from '@/lib/api/posts';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

interface PostItem {
  _id: string; title: string; slug: string; content: string;
  author: { username: string } | null; language: string;
  tags: string[]; createdAt: string;
}

export default function BlogListingPage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGetPosts({ page: String(page), limit: '10' });
      setPosts(data.data || data);
      setTotalPages(data.meta?.totalPages ?? data.totalPages ?? 1);
    } catch { /* */ } finally { setIsLoading(false); }
  }, [page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const excerpt = (content: string) => (content || '').replace(/[#*`\[\]]/g, '').slice(0, 180) + '...';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">{t('blog.title')}</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">{t('blog.subtitle')}</p>
        </div>
        <Link href="/write" className="px-4 py-2 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-sm font-medium rounded-lg transition-colors">
          {t('blog.write')}
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[var(--color-border)] bg-white p-5">
              <div className="h-5 bg-[var(--color-bg-hover)] rounded w-3/4 mb-3" />
              <div className="h-3 bg-[var(--color-bg-hover)] rounded w-full mb-2" />
              <div className="h-3 bg-[var(--color-bg-hover)] rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-center text-[var(--color-text-muted)] py-12">{t('blog.noArticles')}</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link key={post._id} href={`/blog/${post.slug}`} className="block group rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-2">
                {post.author && (
                  <>
                    <span className="font-medium text-[var(--color-text-secondary)]">{post.author.username}</span>
                    <span>·</span>
                  </>
                )}
                <span>{formatDate(post.createdAt)}</span>
                <span>·</span>
                <span className="uppercase">{post.language}</span>
              </div>
              <h2 className="text-lg font-bold text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors mb-1.5">{post.title}</h2>
              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">{excerpt(post.content)}</p>
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {post.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border-light)]">{tag}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('common.previous')}</Button>
          <span className="text-sm text-[var(--color-text-muted)]">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>{t('common.next')}</Button>
        </div>
      )}
    </div>
  );
}
