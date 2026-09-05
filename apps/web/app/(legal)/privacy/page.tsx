"use client";

import { useTranslation } from "@/lib/i18n";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <article className="prose prose-slate max-w-none">
      <h1 className="text-2xl font-bold text-text mb-1">
        {t("legal.privacy.title")}
      </h1>
      <p className="text-sm text-text-muted mb-8">
        {t("legal.privacy.lastUpdated")}
      </p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text mb-3">
          {t("legal.privacy.introTitle")}
        </h2>
        <p className="text-text-secondary leading-relaxed">
          {t("legal.privacy.introText")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text mb-3">
          {t("legal.privacy.dataCollectedTitle")}
        </h2>
        <p className="text-text-secondary leading-relaxed mb-3">
          {t("legal.privacy.dataCollectedIntro")}
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
          <li>{t("legal.privacy.dataEmail")}</li>
          <li>{t("legal.privacy.dataUsername")}</li>
          <li>{t("legal.privacy.dataPassword")}</li>
          <li>{t("legal.privacy.dataAvatar")}</li>
          <li>{t("legal.privacy.dataBio")}</li>
          <li>{t("legal.privacy.dataLocale")}</li>
          <li>{t("legal.privacy.dataLanguages")}</li>
        </ul>

        <p className="text-text-secondary leading-relaxed mt-4 mb-3">
          {t("legal.privacy.dataOAuthIntro")}
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
          <li>{t("legal.privacy.dataGoogleId")}</li>
          <li>{t("legal.privacy.dataGoogleEmail")}</li>
          <li>{t("legal.privacy.dataGooglePicture")}</li>
        </ul>

        <p className="text-text-secondary leading-relaxed mt-4 mb-3">
          {t("legal.privacy.dataUGCIntro")}
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
          <li>{t("legal.privacy.dataPosts")}</li>
          <li>{t("legal.privacy.dataComments")}</li>
          <li>{t("legal.privacy.dataRoadmaps")}</li>
          <li>{t("legal.privacy.dataVotes")}</li>
          <li>{t("legal.privacy.dataFavorites")}</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text mb-3">
          {t("legal.privacy.cookiesTitle")}
        </h2>
        <p className="text-text-secondary leading-relaxed">
          {t("legal.privacy.cookiesText")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text mb-3">
          {t("legal.privacy.purposeTitle")}
        </h2>
        <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
          <li>{t("legal.privacy.purposeAccount")}</li>
          <li>{t("legal.privacy.purposeContent")}</li>
          <li>{t("legal.privacy.purposePersonalization")}</li>
          <li>{t("legal.privacy.purposeSecurity")}</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text mb-3">
          {t("legal.privacy.legalBasisTitle")}
        </h2>
        <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
          <li>{t("legal.privacy.basisContract")}</li>
          <li>{t("legal.privacy.basisConsent")}</li>
          <li>{t("legal.privacy.basisLegitimate")}</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text mb-3">
          {t("legal.privacy.retentionTitle")}
        </h2>
        <p className="text-text-secondary leading-relaxed">
          {t("legal.privacy.retentionText")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text mb-3">
          {t("legal.privacy.rightsTitle")}
        </h2>
        <p className="text-text-secondary leading-relaxed mb-3">
          {t("legal.privacy.rightsIntro")}
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
          <li>{t("legal.privacy.rightAccess")}</li>
          <li>{t("legal.privacy.rightRectification")}</li>
          <li>{t("legal.privacy.rightErasure")}</li>
          <li>{t("legal.privacy.rightPortability")}</li>
          <li>{t("legal.privacy.rightOpposition")}</li>
          <li>{t("legal.privacy.rightRestriction")}</li>
        </ul>
        <p className="text-text-secondary leading-relaxed mt-3">
          {t("legal.privacy.rightsContact")}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text mb-3">
          {t("legal.privacy.securityTitle")}
        </h2>
        <p className="text-text-secondary leading-relaxed">
          {t("legal.privacy.securityText")}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-text mb-3">
          {t("legal.privacy.cnilTitle")}
        </h2>
        <p className="text-text-secondary leading-relaxed">
          {t("legal.privacy.cnilText")}
        </p>
      </section>
    </article>
  );
}
