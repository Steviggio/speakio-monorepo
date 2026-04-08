'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Cookies from 'js-cookie';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiUpdateProfile, apiUploadAvatar } from '@/lib/api/users';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LanguageCode } from '@repo/types';
import { useTranslation } from '@/lib/i18n';

const profileSchema = z.object({
  bio: z.string().max(300, 'Bio must be less than 300 characters').optional(),
  locale: z.string().optional(),
  learningLanguagesString: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettingsPage() {
  const { user, login } = useAuth();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        bio: user.bio || '',
        locale: user.locale || 'en',
        learningLanguagesString: user.learningLanguages?.join(', ') || '',
      });
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {

      const payload = { ...data } as any;
      if (data.learningLanguagesString) {
        payload.learningLanguages = data.learningLanguagesString.split(',').map((l) => l.trim()).filter((l) => l.length > 0) as LanguageCode[];
      } else {
        payload.learningLanguages = [];
      }
      delete payload.learningLanguagesString;
      const updatedUser = await apiUpdateProfile(payload);
      if (user) login(Cookies.get('access_token') || '', updatedUser);
      setSuccessMsg(t('settings.profileUpdated'));
    } catch (err) {

      const e = err as any;
      setErrorMsg(e.response?.data?.message || t('settings.updateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingAvatar(true);
    setErrorMsg('');
    try {
      if (!file) return;
      const { avatarUrl } = await apiUploadAvatar(file);
      setAvatarPreview(avatarUrl);
      if (user) login(Cookies.get('access_token') || '', { ...user, avatarUrl });
    } catch (err) {

      const e = err as any;
      setErrorMsg(e.response?.data?.message || t('settings.updateFailed'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text)]">{t('settings.profileTitle')}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">{t('settings.profileDesc')}</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{successMsg}</div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{errorMsg}</div>
      )}

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-5 mb-6 items-start sm:items-center">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-[var(--color-bg-hover)] border-2 border-[var(--color-border)] shrink-0 relative group">
            {avatarPreview ? (

              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold uppercase text-[var(--color-text-muted)]">
                {user.username.charAt(0)}
              </div>
            )}
            <div
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="text-xs font-medium text-white">Change</span>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </div>
          <div>
            <h3 className="font-medium text-[var(--color-text)] text-sm">{t('settings.profilePicture')}</h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-2">{t('settings.uploadHint')}</p>
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} isLoading={uploadingAvatar}>
              {t('settings.uploadBtn')}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">{t('settings.bio')}</label>
            <textarea
              {...register('bio')}
              className="w-full px-3.5 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] placeholder:text-[var(--color-text-muted)] min-h-[100px] resize-none"
              placeholder={t('settings.bioPlaceholder')}
            />
            {errors.bio && <p className="mt-1 text-xs text-red-500">{errors.bio.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t('settings.learningLanguages')} placeholder="en, fr, es" {...register('learningLanguagesString')} error={errors.learningLanguagesString?.message} />
            <Input label={t('settings.nativeLocale')} placeholder="en" {...register('locale')} error={errors.locale?.message} />
          </div>

          <div className="pt-3 flex justify-end">
            <Button type="submit" isLoading={isSaving}>{t('settings.saveChanges')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
