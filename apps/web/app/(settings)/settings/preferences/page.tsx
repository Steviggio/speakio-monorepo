"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const interfaceLanguages = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
];

const resourcesPerPageOptions = [6, 12, 24, 48];

export default function PreferencesSettingsPage() {
  const { user } = useAuth();
  const { locale, setLocale, t } = useTranslation();
  const [interfaceLang, setInterfaceLang] = useState(locale);
  const [resourcesPerPage, setResourcesPerPage] = useState(12);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const prefs = localStorage.getItem("speakio_preferences");
    if (prefs) {
      try {
        const parsed = JSON.parse(prefs);
        setInterfaceLang((parsed.interfaceLang as "en" | "fr") || "en");
        setResourcesPerPage(parsed.resourcesPerPage || 12);
        setEmailNotifications(parsed.emailNotifications ?? true);
      } catch {}
    }
  }, []);

  const handleSave = () => {
    const prefs = { interfaceLang, resourcesPerPage, emailNotifications };
    localStorage.setItem("speakio_preferences", JSON.stringify(prefs));
    setLocale(interfaceLang as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text)]">
          {t("settings.preferencesTitle")}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {t("settings.preferencesDesc")}
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {t("settings.preferencesSaved")}
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">
          {t("settings.display")}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
              {t("settings.interfaceLanguage")}
            </label>
            <select
              value={interfaceLang}
              onChange={(e) => setInterfaceLang(e.target.value as "en" | "fr")}
              className="w-full max-w-xs h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none"
            >
              {interfaceLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {t("settings.interfaceLanguageDesc")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
              {t("settings.resourcesPerPage")}
            </label>
            <select
              value={resourcesPerPage}
              onChange={(e) => setResourcesPerPage(Number(e.target.value))}
              className="w-full max-w-xs h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none"
            >
              {resourcesPerPageOptions.map((n) => (
                <option key={n} value={n}>
                  {n} {t("settings.perPage")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">
          {t("settings.notifications")}
        </h2>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">
              {t("settings.emailNotifications")}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {t("settings.emailNotificationsDesc")}
            </p>
          </div>
          <button
            onClick={() => setEmailNotifications(!emailNotifications)}
            className={`relative w-10 h-6 rounded-full transition-colors ${emailNotifications ? "bg-[var(--color-brand)]" : "bg-[var(--color-border)]"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emailNotifications ? "translate-x-4" : "translate-x-0"}`}
            />
          </button>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>{t("settings.savePreferences")}</Button>
      </div>
    </div>
  );
}
