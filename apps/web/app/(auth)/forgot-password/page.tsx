'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { apiForgotPassword } from '@/lib/api/auth';
import { useTranslation } from '@/lib/i18n';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiForgotPassword(email);
      setSuccess(t('auth.resetSent'));
    } catch (err) {
      const e = err as any;
      setError(e.response?.data?.message || 'Failed to request reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-7">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">{t('auth.forgotTitle')}</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1.5">{t('auth.forgotDesc')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-3 text-sm font-medium text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>
        )}
        {success ? (
          <div className="p-3 text-sm text-green-700 bg-green-50 rounded-lg border border-green-200 flex flex-col gap-2">
            <p>{success}</p>
            <Link href="/login" className="text-center text-[var(--color-brand)] font-medium hover:text-[var(--color-brand-hover)]">{t('auth.backToLogin')}</Link>
          </div>
        ) : (
          <>
            <Input label={t('auth.emailAddress')} type="email" placeholder="name@example.com" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required />
            <div className="pt-1">
              <Button type="submit" className="w-full" isLoading={isLoading}>{t('auth.sendResetLink')}</Button>
            </div>
            <div className="mt-4 flex items-center justify-center text-sm">
              <Link href="/login" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">{t('auth.backToLogin')}</Link>
            </div>
          </>
        )}
      </form>
    </Card>
  );
}
