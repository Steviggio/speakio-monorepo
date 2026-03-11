'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { useTranslation } from '@/lib/i18n';

export default function AccountSettingsPage() {
  const { user, login, logout } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();


  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');


  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');


  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    setEmailSuccess('');
    setEmailError('');
    try {
      const response = await apiClient.post('/auth/change-email', { newEmail });
      if (user) login(response.data.access_token || '', { ...user, email: newEmail });
      setEmailSuccess(t('settings.emailUpdated'));
      setNewEmail('');
    } catch (err: any) {
      setEmailError(err.response?.data?.message || t('settings.emailFailed'));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.passwordsMismatch'));
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(t('settings.passwordTooShort'));
      return;
    }
    setPasswordLoading(true);
    setPasswordSuccess('');
    setPasswordError('');
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      setPasswordSuccess(t('settings.passwordUpdated'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || t('settings.passwordFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await apiClient.delete('/users/me');
      logout();
      router.push('/');
    } catch {
      /* silent */
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text)]">{t('settings.accountTitle')}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">{t('settings.accountDesc')}</p>
      </div>

      {/* Change Email */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">{t('settings.changeEmail')}</h2>
        {emailSuccess && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm mb-4">{emailSuccess}</div>}
        {emailError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm mb-4">{emailError}</div>}
        <form onSubmit={handleChangeEmail} className="space-y-3">
          <div className="text-sm text-[var(--color-text-secondary)] mb-2">
            {t('settings.currentEmail')}: <span className="font-medium text-[var(--color-text)]">{user.email}</span>
          </div>
          <Input
            label={t('settings.newEmail')}
            type="email"
            placeholder="new@example.com"
            value={newEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
            required
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" isLoading={emailLoading}>{t('settings.updateEmail')}</Button>
          </div>
        </form>
      </Card>

      {/* Change Password */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">{t('settings.changePassword')}</h2>
        {passwordSuccess && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm mb-4">{passwordSuccess}</div>}
        {passwordError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm mb-4">{passwordError}</div>}
        <form onSubmit={handleChangePassword} className="space-y-3">
          <Input
            label={t('settings.currentPassword')}
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label={t('settings.newPasswordLabel')}
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
              required
            />
            <Input
              label={t('settings.confirmNewPassword')}
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" isLoading={passwordLoading}>{t('settings.updatePassword')}</Button>
          </div>
        </form>
      </Card>

      {/* Delete Account */}
      <Card className="p-6 border-red-200">
        <h2 className="text-base font-semibold text-red-600 mb-1">{t('settings.dangerZone')}</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">{t('settings.dangerDesc')}</p>
        {!showDeleteConfirm ? (
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-500 border-red-200 hover:bg-red-50"
          >
            {t('settings.deleteAccount')}
          </Button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <p className="text-sm text-red-600">
              {t('settings.deleteConfirmPrompt').replace('{confirm}', '')} <span className="font-mono font-semibold">{t('settings.deleteConfirmText')}</span>
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={t('settings.deleteConfirmText')}
              className="w-full h-10 rounded-lg border border-red-200 bg-white px-3 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== t('settings.deleteConfirmText')}
                className="bg-red-500 hover:bg-red-600 focus:ring-red-500/40"
              >
                {t('settings.permanentlyDelete')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
