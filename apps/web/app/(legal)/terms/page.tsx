"use client";

import { useTranslation } from "@/lib/i18n";

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <article className="prose prose-slate max-w-none">
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">
        {t("legal.terms.title")}
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-8">
        {t("legal.terms.lastUpdated")}
      </p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          {t("legal.terms.acceptanceTitle")}
        </h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          {t("legal.terms.acceptanceText")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          {t("legal.terms.serviceTitle")}
        </h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          {t("legal.terms.serviceText")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          {t("legal.terms.accountTitle")}
        </h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          {t("legal.terms.accountText")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          {t("legal.terms.contentTitle")}
        </h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          {t("legal.terms.contentText")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          {t("legal.terms.conductTitle")}
        </h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-3">
          {t("legal.terms.conductIntro")}
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-[var(--color-text-secondary)]">
          <li>{t("legal.terms.conductHarassment")}</li>
          <li>{t("legal.terms.conductSpam")}</li>
          <li>{t("legal.terms.conductIllegal")}</li>
          <li>{t("legal.terms.conductInfringement")}</li>
          <li>{t("legal.terms.conductImpersonation")}</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          {t("legal.terms.ipTitle")}
        </h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          {t("legal.terms.ipText")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          {t("legal.terms.terminationTitle")}
        </h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          {t("legal.terms.terminationText")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          {t("legal.terms.liabilityTitle")}
        </h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          {t("legal.terms.liabilityText")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          {t("legal.terms.modificationTitle")}
        </h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          {t("legal.terms.modificationText")}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          {t("legal.terms.lawTitle")}
        </h2>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          {t("legal.terms.lawText")}
        </p>
      </section>
    </article>
  );
}
