"use client";

import { useTranslation } from "@/lib/i18n";

export default function LegalNoticePage() {
  const { t } = useTranslation();

  return (
    <article className="prose prose-slate max-w-none">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">
        {t("legal.notice.title")}
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-8">
        {t("legal.notice.lastUpdated")}
      </p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          {t("legal.notice.editorTitle")}
        </h2>
        <div className="text-[var(--color-text-secondary)] leading-relaxed space-y-1">
          <p>{t("legal.notice.editorName")}</p>
          <p>{t("legal.notice.editorAddress")}</p>
          <p>{t("legal.notice.editorEmail")}</p>
          <p>{t("legal.notice.editorDirector")}</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          {t("legal.notice.hostTitle")}
        </h2>
        <div className="text-[var(--color-text-secondary)] leading-relaxed space-y-1">
          <p>{t("legal.notice.hostName")}</p>
          <p>{t("legal.notice.hostAddress")}</p>
          <p>{t("legal.notice.hostWebsite")}</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          {t("legal.notice.ipTitle")}
        </h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          {t("legal.notice.ipText")}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          {t("legal.notice.liabilityTitle")}
        </h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          {t("legal.notice.liabilityText")}
        </p>
      </section>
    </article>
  );
}
