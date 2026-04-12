"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { apiGetRoadmapStats } from "@/lib/api/roadmaps";
import { apiGetMyPosts } from "@/lib/api/posts";
import { apiGetFavorites } from "@/lib/api/social";
import { useTranslation } from "@/lib/i18n";

interface Stats {
  totalRoadmaps: number;
  totalSteps: number;
  completedSteps: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [roadmapStats, posts, favs] = await Promise.all([
          apiGetRoadmapStats().catch(() => ({
            totalRoadmaps: 0,
            totalSteps: 0,
            completedSteps: 0,
          })),
          apiGetMyPosts().catch(() => []),
          apiGetFavorites().catch(() => []),
        ]);
        setStats(roadmapStats);
        setPostCount(posts?.length || 0);
        setFavCount(favs?.length || 0);
      } catch {}
    };
    fetchData();
  }, [user]);

  const progress =
    stats && stats.totalSteps > 0
      ? Math.round((stats.completedSteps / stats.totalSteps) * 100)
      : 0;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">
          {t("dashboard.welcomeBack")}
          {user?.username ? `, ${user.username}` : ""}
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          {t("dashboard.overview")}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: t("dashboard.roadmaps"),
            value: stats?.totalRoadmaps ?? "—",
            color: "text-[var(--color-brand)]",
          },
          {
            label: t("dashboard.progress"),
            value: `${progress}%`,
            color: "text-green-600",
          },
          {
            label: t("dashboard.articles"),
            value: postCount,
            color: "text-[var(--color-text)]",
          },
          {
            label: t("dashboard.favorites"),
            value: favCount,
            color: "text-amber-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-[var(--color-border)] bg-white p-4 text-center shadow-sm"
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {stats && stats.totalSteps > 0 && (
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              {t("dashboard.learningProgress")}
            </h3>
            <span className="text-xs text-[var(--color-text-muted)]">
              {stats.completedSteps}/{stats.totalSteps} {t("dashboard.steps")}
            </span>
          </div>
          <div className="h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-brand)] rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            href: "/roadmaps",
            title: t("dashboard.myRoadmaps"),
            desc: t("dashboard.myRoadmapsDesc"),
          },
          {
            href: "/resources",
            title: t("dashboard.resourcesTitle"),
            desc: t("dashboard.resourcesDesc"),
          },
          {
            href: "/blog",
            title: t("dashboard.blogTitle"),
            desc: t("dashboard.blogDesc"),
          },
          {
            href: "/favorites",
            title: t("dashboard.favoritesTitle"),
            desc: t("dashboard.favoritesDesc"),
          },
          {
            href: "/write",
            title: t("dashboard.writeTitle"),
            desc: t("dashboard.writeDesc"),
          },
          {
            href: "/settings/profile",
            title: t("dashboard.settingsTitle"),
            desc: t("dashboard.settingsDesc"),
          },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-lg border border-[var(--color-border)] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-brand)] transition-colors mb-1">
              {link.title}
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              {link.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
