'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGetPost, apiDeletePost } from '@/lib/api/posts';
import { useAuth } from '@/lib/hooks/useAuth';
import CommentSection from '@/components/CommentSection';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface PostDetail {
  _id: string; title: string; slug: string; content: string;
  author: { _id: string; username: string } | null;
  language: string; tags: string[]; createdAt: string;
}

function renderMarkdown(md: string): string {
  return (md || '')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-[var(--color-text)] mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-[var(--color-text)] mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-[var(--color-text)] mt-8 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-[var(--color-text)]">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-4 my-4 overflow-x-auto text-sm text-[var(--color-text-secondary)]"><code>$1</code></pre>')
    .replace(/`(.+?)`/g, '<code class="bg-[var(--color-bg)] px-1.5 py-0.5 rounded text-sm text-[var(--color-brand)]">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] underline">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-[var(--color-text-secondary)]">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-[var(--color-text-secondary)] leading-relaxed mb-4">')
    .replace(/\n/g, '<br/>');
}

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { user } = useAuth();
  const { t } = useTranslation();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPost = useCallback(async () => {
    try { const data = await apiGetPost(slug); setPost(data); }
    catch { setError(true); } finally { setIsLoading(false); }
  }, [slug]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  const handleDelete = async () => {
    if (!post || isDeleting) return;
    setIsDeleting(true);
    try {
      await apiDeletePost(post._id);
      router.push('/blog');
    } catch {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const isAuthor = user && post?.author && (user as any)._id === post.author._id;

  if (isLoading) return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="animate-pulse">
        <div className="h-8 bg-[var(--color-bg-hover)] rounded w-3/4 mb-6" />
        <div className="h-4 bg-[var(--color-bg-hover)] rounded w-full mb-3" />
        <div className="h-4 bg-[var(--color-bg-hover)] rounded w-5/6" />
      </div>
    </div>
  );

  if (error || !post) return (
    <div className="max-w-3xl mx-auto py-8 px-4 text-center">
      <p className="text-[var(--color-text-muted)]">{t('blog.notFound')}</p>
      <Link href="/blog" className="text-[var(--color-brand)] mt-3 inline-block text-sm">{t('blog.backToBlog')}</Link>
    </div>
  );

  return (
    <article className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <Link href="/blog" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">{t('blog.backToBlog')}</Link>
        {isAuthor && (
          <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)} className="text-red-500 hover:text-red-600 px-2 h-auto text-xs py-1">
            {t('blog.delete')}
          </Button>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-lg border border-[var(--color-border)] shadow-xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">{t('blog.deleteTitle')}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-5">{t('blog.deleteDesc')}</p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleDelete} isLoading={isDeleting} className="bg-red-500 hover:bg-red-600 focus:ring-red-500/40">
                {isDeleting ? t('blog.deleting') : t('blog.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] leading-tight mb-3">{post.title}</h1>
        <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
          {post.author && (
            <>
              <div className="w-8 h-8 rounded-full bg-[var(--color-bg-hover)] flex items-center justify-center text-xs text-[var(--color-text-secondary)] font-semibold">
                {post.author.username[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-[var(--color-text)] font-medium text-sm">{post.author.username}</p>
                <p className="text-xs">{new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · {post.language.toUpperCase()}</p>
              </div>
            </>
          )}
        </div>
      </header>

      <div
        className="prose max-w-none text-[var(--color-text-secondary)] leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: `<p class="text-[var(--color-text-secondary)] leading-relaxed mb-4">${renderMarkdown(post.content)}</p>`,
        }}
      />

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-8 pt-5 border-t border-[var(--color-border-light)]">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border-light)]">{tag}</span>
          ))}
        </div>
      )}

      <CommentSection targetType="Post" targetId={post._id} />
    </article>
  );
}
