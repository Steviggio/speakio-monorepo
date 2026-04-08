'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/lib/i18n';
import { apiGetResource, apiUpdateResource } from '@/lib/api/resources';
import { type ResourceType, type Pricing, RESOURCE_TYPES, PRICING_VALUES } from '@repo/types';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';

const types = Object.values(RESOURCE_TYPES);
const pricingOptions = Object.values(PRICING_VALUES);

export default function AdminEditResourcePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [initialData, setInitialData] = useState<any>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<string>('');
  const [language, setLanguage] = useState('');
  const [pricing, setPricing] = useState<string>('');

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, router]);

  const loadResource = useCallback(async () => {
    if (!params.id) return;
    setIsLoading(true);
    try {
      const data = await apiGetResource(params.id);
      setInitialData(data);
      setTitle(data.title || '');
      setDescription(data.description || '');
      setUrl(data.url || '');
      setType(data.type || '');
      setLanguage(data.language || '');
      setPricing(data.pricing || '');
    } catch (error) {
      console.error('Failed to load resource', error);
      toast.error(t('admin.resources.loadError'));
      router.push('/admin/resources');
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router, t]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadResource();
    }
  }, [user, loadResource]);

  const hasChanges = () => {
    if (!initialData) return false;
    return (
      title !== initialData.title ||
      description !== initialData.description ||
      url !== initialData.url ||
      type !== initialData.type ||
      language !== initialData.language ||
      pricing !== initialData.pricing
    );
  };

  const handleSave = async () => {
    if (!hasChanges()) return;

    setIsSaving(true);
    try {
      await apiUpdateResource(params.id, {
        title,
        description,
        url,
        type,
        language,
        pricing
      });
      toast.success(t('admin.resources.updateSuccess'));
      router.push('/admin/resources');
    } catch (error) {
      console.error('Failed to update resource', error);
      toast.error(t('admin.resources.updateError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 bg-[var(--color-bg-hover)] w-64 rounded"></div>
          <div className="h-96 bg-[var(--color-bg-hover)] w-full max-w-2xl rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/resources"
          className="p-2 rounded-full hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-secondary)]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">{t('admin.resources.editResource')}</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">{initialData?._id}</p>
        </div>
      </div>

      <Card className="border border-[var(--color-border)] shadow-sm">
        <CardHeader className="border-b border-[var(--color-border-light)] bg-gray-50/50">
          <CardTitle>{t('admin.resources.mainInfo')}</CardTitle>
          <CardDescription>
            {t('admin.resources.editDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="title">{t('common.title')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('admin.resources.namePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">{t('common.url')}</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="type">{t('admin.resources.resourceType')}</Label>
              <Select value={type} onValueChange={(val) => setType(val || '')}>
                <SelectTrigger id="type">
                  <SelectValue placeholder={t('admin.resources.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {types.map((k) => (
                    <SelectItem key={k} value={k}>{t(`resources.types.${k}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricing">{t('admin.resources.pricingModel')}</Label>
              <Select value={pricing} onValueChange={(val) => setPricing(val || '')}>
                <SelectTrigger id="pricing">
                  <SelectValue placeholder={t('admin.resources.selectModel')} />
                </SelectTrigger>
                <SelectContent>
                  {pricingOptions.map((k) => (
                    <SelectItem key={k} value={k}>{t(`resources.pricing.${k}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="language">{t('admin.resources.languageCode')}</Label>
              <Input
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Ex: en, fr, es..."
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('common.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('admin.resources.descPlaceholder')}
              className="min-h-[120px] resize-y"
            />
          </div>
        </CardContent>

        <CardFooter className="border-t border-[var(--color-border-light)] bg-gray-50/50 py-4 flex justify-between items-center">
          <span className="text-sm text-[var(--color-text-muted)]">
            {t('resources.submittedBy')} : {initialData?.submittedBy?.username || t('admin.resources.system')}
          </span>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/resources')}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges() || isSaving}
              className="bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white"
            >
              {isSaving ? t('admin.resources.saving') : t('admin.resources.saveChanges')}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
