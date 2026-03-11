'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiRegister } from '@/lib/api/auth';
import { useTranslation } from '@/lib/i18n';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await apiRegister({ email, username, password });
      login(response.access_token, response.user);
      router.refresh();
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get('callbackUrl');
      router.push(callbackUrl ? decodeURI(callbackUrl) : '/dashboard');
    } catch (err) {
      const e = err as any;
      setError(e.response?.data?.message || t('auth.registerFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-7">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">{t('auth.createAccount')}</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1.5">{t('auth.joinCommunity')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-3 text-sm font-medium text-red-600 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}
        <Input label={t('auth.username')} type="text" placeholder="johndoe" value={username} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)} required />
        <Input label={t('auth.emailAddress')} type="email" placeholder="name@example.com" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required />
        <Input label={t('auth.password')} type="password" placeholder="••••••••" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required />

        <div className="pt-1">
          <Button type="submit" className="w-full" isLoading={isLoading}>{t('auth.signup')}</Button>
        </div>
      </form>

      <div className="mt-5 flex items-center justify-center space-x-1.5 text-sm text-[var(--color-text-muted)]">
        <span>{t('auth.alreadyHaveAccount')}</span>
        <Link href="/login" className="text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] font-medium transition-colors">{t('auth.signIn')}</Link>
      </div>
    </Card>
  );
}
