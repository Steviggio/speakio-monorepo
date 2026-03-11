'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiCreatePost } from '@/lib/api/posts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';

export default function WritePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('en');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return (
    <div className="max-w-3xl mx-auto py-16 px-4 text-center">
      <p className="text-[var(--color-text-muted)]"><Link href="/login" className="text-[var(--color-brand)]">{t('nav.login')}</Link>{t('blog.toWriteAnArticle')}</p>
    </div>
  );

  const handleSubmit = async (status: 'published' | 'draft') => {
    if (!title.trim() || !content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      await apiCreatePost({ title: title.trim(), content: content.trim(), language, tags: tagList, status });
      router.push('/blog');
    } catch { /* */ } finally { setIsSubmitting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight mb-6">{t('blog.writeArticle')}</h1>

      <div className="space-y-4">
        <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('blog.articleTitle')}
          className="h-12 text-lg font-semibold" />

        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('blog.writeInMarkdown')} rows={16}
          className="w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] resize-none leading-relaxed font-mono" />

        <div className="flex flex-col sm:flex-row gap-3">
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none">
            <option value="en">English</option><option value="fr">Français</option><option value="es">Español</option><option value="de">Deutsch</option>
          </select>
          <div className="flex-1 pt-0.5"><Input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t('blog.tagsPlaceholder')} className="h-10" /></div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={() => handleSubmit('published')} isLoading={isSubmitting} disabled={!title.trim() || !content.trim()}>
            {isSubmitting ? t('blog.publishing') : t('blog.publish')}
          </Button>
          <Button variant="outline" onClick={() => handleSubmit('draft')} isLoading={isSubmitting} disabled={!title.trim() || !content.trim()}>
            {t('blog.saveAsDraft')}
          </Button>
        </div>
      </div>
    </div>
  );
}
