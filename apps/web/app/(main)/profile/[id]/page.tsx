"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiGetUserProfile } from "@/lib/api/users";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";

interface UserProfile {
  _id: string;
  username: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  learningLanguages?: string[];
  createdAt?: string;
}

export default function ProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const { user: currentUser } = useAuth();
  const { t, locale } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiGetUserProfile(id);
      setProfile(data);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading)
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="animate-pulse rounded-lg border border-[var(--color-border)] bg-white p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-[var(--color-bg-hover)]" />
            <div className="flex-1 space-y-3 w-full">
              <div className="h-6 bg-[var(--color-bg-hover)] rounded w-1/3" />
              <div className="h-4 bg-[var(--color-bg-hover)] rounded w-2/3" />
              <div className="flex gap-2">
                <div className="h-6 bg-[var(--color-bg-hover)] rounded w-12" />
                <div className="h-6 bg-[var(--color-bg-hover)] rounded w-12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );

  if (error || !profile)
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 text-center">
        <p className="text-[var(--color-text-muted)]">
          {t("profile.notFound")}
        </p>
        <Link
          href="/dashboard"
          className="text-[var(--color-brand)] mt-3 inline-block text-sm"
        >
          {t("profile.backToDashboard")}
        </Link>
      </div>
    );

  const isOwnProfile = currentUser && (currentUser as any)._id === profile._id;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="rounded-lg border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-2 border-[var(--color-border)] bg-[var(--color-bg-hover)] flex items-center justify-center">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl text-[var(--color-text-muted)] font-bold uppercase">
                {profile.username?.charAt(0) || "?"}
              </span>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-[var(--color-text)]">
                {profile.username}
              </h1>
              {isOwnProfile && (
                <Link
                  href="/settings/profile"
                  className="text-xs text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] transition-colors font-medium"
                >
                  {t("profile.editProfile")}
                </Link>
              )}
            </div>
            {profile.bio ? (
              <p className="text-[var(--color-text-secondary)]">
                {profile.bio}
              </p>
            ) : (
              <p className="text-[var(--color-text-muted)] italic text-sm">
                {isOwnProfile ? t("profile.noBioOwn") : t("profile.noBio")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5 justify-center md:justify-start">
              {profile.learningLanguages?.map((lang: string) => (
                <span
                  key={lang}
                  className="px-2.5 py-1 bg-[var(--color-bg)] text-[var(--color-text-secondary)] rounded-md text-xs font-medium border border-[var(--color-border-light)] uppercase"
                >
                  {lang}
                </span>
              ))}
              {(!profile.learningLanguages ||
                profile.learningLanguages.length === 0) && (
                <span className="px-2.5 py-1 bg-[var(--color-bg)] text-[var(--color-text-muted)] rounded-md text-xs border border-[var(--color-border-light)]">
                  {t("profile.noLanguages")}
                </span>
              )}
            </div>
            {profile.createdAt && (
              <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                {t("profile.memberSince")}{" "}
                {new Date(profile.createdAt).toLocaleDateString(
                  locale || "en-US",
                  { month: "long", year: "numeric" },
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
