"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
          <div className="col-span-2 md:col-span-1">
            <span className="text-base font-bold text-text tracking-tight">
              speakio
            </span>
            <p className="text-sm text-text-muted mt-2 leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              {t("footer.discover")}
            </h4>
            <ul className="space-y-1.5 text-sm text-text-secondary">
              <li>
                <Link
                  href="/resources"
                  className="hover:text-text transition-colors"
                >
                  {t("nav.resources")}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-text transition-colors"
                >
                  {t("nav.blog")}
                </Link>
              </li>
              {/* <li>
                <Link
                  href="/roadmaps"
                  className="hover:text-text transition-colors"
                >
                  {t("nav.roadmaps")}
                </Link>
              </li> */}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              {t("footer.account")}
            </h4>
            <ul className="space-y-1.5 text-sm text-text-secondary">
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-text transition-colors"
                >
                  {t("nav.dashboard")}
                </Link>
              </li>
              <li>
                <Link
                  href="/favorites"
                  className="hover:text-text transition-colors"
                >
                  {t("nav.favorites")}
                </Link>
              </li>
              <li>
                <Link
                  href="/settings/profile"
                  className="hover:text-text transition-colors"
                >
                  {t("nav.settings")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              {t("footer.create")}
            </h4>
            <ul className="space-y-1.5 text-sm text-text-secondary">
              <li>
                <Link
                  href="/write"
                  className="hover:text-text transition-colors"
                >
                  {t("footer.writeArticle")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              {t("footer.legal")}
            </h4>
            <ul className="space-y-1.5 text-sm text-text-secondary">
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-text transition-colors"
                >
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-text transition-colors"
                >
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/legal-notice"
                  className="hover:text-text transition-colors"
                >
                  {t("footer.legalNotice")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border-light pt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <span>© {new Date().getFullYear()} Speakio</span>
          <nav className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="hover:text-text transition-colors"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              href="/terms"
              className="hover:text-text transition-colors"
            >
              {t("footer.terms")}
            </Link>
            <Link
              href="/legal-notice"
              className="hover:text-text transition-colors"
            >
              {t("footer.legalNotice")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
