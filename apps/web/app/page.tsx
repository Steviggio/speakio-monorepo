"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "@/lib/i18n";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text mb-5 leading-tight whitespace-pre-line">
            {t("landing.title")}
          </h1>
          <p className="text-lg text-text-secondary mb-10 max-w-lg mx-auto leading-relaxed">
            {t("landing.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/resources"
              className="inline-flex items-center justify-center px-6 py-3 bg-brand hover:bg-brand-hover text-white font-medium rounded-lg transition-colors"
            >
              {t("landing.browseResources")}
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 border border-border bg-white hover:bg-bg-hover text-text font-medium rounded-lg transition-colors"
            >
              {t("landing.joinSpeakio")}
            </Link>
          </div>
        </div>

        <div className="mt-20 max-w-3xl w-full grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="text-text font-semibold mb-1.5 text-sm">
              {t("landing.featureCurated")}
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              {t("landing.featureCuratedDesc")}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="text-text font-semibold mb-1.5 text-sm">
              {t("landing.featureShare")}
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              {t("landing.featureShareDesc")}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="text-text font-semibold mb-1.5 text-sm">
              {t("landing.featureTrack")}
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              {t("landing.featureTrackDesc")}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
