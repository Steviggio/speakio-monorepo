'use client';

import React, { useState, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiResetPassword } from '@/lib/api/auth';
import { useTranslation } from '@/lib/i18n';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setError('Invalid or missing reset token.'); return; }
    setIsLoading(true);
    setError('');
    try {
      await apiResetPassword({ token, newPassword });
      setSuccess(t('auth.passwordUpdated'));
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      const e = err as any;
      setError(e.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <Card className="p-7 text-center">
        <p className="text-red-500 text-sm mb-3">Invalid or missing reset token.</p>
        <Link href="/forgot-password" className="text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] text-sm">Request a new link</Link>
      </Card>
    );
  }

  return (
    <Card className="p-7">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">{t('auth.resetTitle')}</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1.5">{t('auth.resetDesc')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <div className="p-3 text-sm font-medium text-red-600 bg-red-50 rounded-lg border border-red-100">{error}</div>}
        {success ? (
          <div className="p-3 text-sm text-green-700 bg-green-50 rounded-lg border border-green-200">{success}</div>
        ) : (
          <>
            <Input label={t('auth.newPassword')} type="password" placeholder="••••••••" value={newPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)} required />
            <div className="pt-1">
              <Button type="submit" className="w-full" isLoading={isLoading}>{t('auth.resetPassword')}</Button>
            </div>
          </>
        )}
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Card className="p-7"><div className="text-center text-[var(--color-text-muted)]">Loading...</div></Card>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
