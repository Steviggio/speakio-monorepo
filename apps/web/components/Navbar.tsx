"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";

const navLinks = [
  { href: "/resources", labelKey: "nav.resources" },
  { href: "/blog", labelKey: "nav.blog" },
  { href: "/roadmaps", labelKey: "nav.roadmaps" },
  { href: "/favorites", labelKey: "nav.favorites" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[var(--color-border)]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-[var(--color-text)] tracking-tight">
            speakio
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--color-bg-hover)] text-[var(--color-text)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
                }`}
              >
                {t(link.labelKey)}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/write"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === "/write"
                    ? "bg-[var(--color-bg-hover)] text-[var(--color-text)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
                }`}
              >
                {t("nav.write")}
              </Link>

              <Link
                href="/dashboard"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-[var(--color-bg-hover)] text-[var(--color-text)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
                }`}
              >
                {t("nav.dashboard")}
              </Link>

              <div
                className="relative pl-3 ml-1 border-l border-[var(--color-border)]"
                ref={dropdownRef}
              >
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--color-bg-hover)] flex items-center justify-center text-xs text-[var(--color-text-secondary)] font-semibold">
                    {user.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className={`text-[var(--color-text-muted)] transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  >
                    <path
                      d="M3 4.5L6 7.5L9 4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[var(--color-border)] rounded-lg shadow-lg py-1 z-50">
                    <div className="px-3 py-2 border-b border-[var(--color-border-light)]">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">
                        {user.username}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      href={`/profile/${(user as any)._id}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <circle
                          cx="7"
                          cy="4.5"
                          r="2.5"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <path
                          d="M2.5 12.5C2.5 10 4.5 8.5 7 8.5s4.5 1.5 4.5 4"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                      {t("nav.myProfile")}
                    </Link>

                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin/resources"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-brand)] hover:opacity-80 transition-colors bg-[var(--color-brand)]/5"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            d="M2 3h10v2H2V3zm0 4h10v2H2V7zm0 4h10v2H2v-2z"
                            fill="currentColor"
                          />
                        </svg>
                        Gestion des ressources
                      </Link>
                    )}

                    <Link
                      href="/settings/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <circle
                          cx="7"
                          cy="7"
                          r="2"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <path
                          d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.75 2.75l1.06 1.06M10.19 10.19l1.06 1.06M11.25 2.75l-1.06 1.06M3.81 10.19l-1.06 1.06"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                      {t("nav.settings")}
                    </Link>

                    <div className="border-t border-[var(--color-border-light)] mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            d="M5 7h7m0 0L10 5m2 2l-2 2M8 10v1.5a1 1 0 01-1 1H3a1 1 0 01-1-1v-9a1 1 0 011-1h4a1 1 0 011 1V5"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {t("nav.logout")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-sm font-medium rounded-lg transition-colors"
              >
                {t("nav.signup")}
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            {mobileOpen ? (
              <path
                d="M5 5L15 15M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M3 5H17M3 10H17M3 15H17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-white px-4 pb-4 pt-2">
          <div className="flex flex-col gap-0.5">
            {navLinks.map((link) => {
              const isActive = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--color-bg-hover)] text-[var(--color-text)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {t(link.labelKey)}
                </Link>
              );
            })}
            <div className="border-t border-[var(--color-border-light)] mt-2 pt-2">
              {user ? (
                <>
                  <Link
                    href="/write"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  >
                    {t("nav.write")}
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  >
                    {t("nav.dashboard")}
                  </Link>
                  <Link
                    href={`/profile/${(user as any)._id}`}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  >
                    {t("nav.myProfile")}
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin/resources"
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2 rounded-md text-sm text-[var(--color-brand)] font-medium bg-[var(--color-brand)]/5"
                    >
                      Gestion des ressources
                    </Link>
                  )}
                  <Link
                    href="/settings/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  >
                    {t("nav.settings")}
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50"
                  >
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 text-sm text-[var(--color-text-secondary)]"
                  >
                    {t("nav.login")}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 text-sm text-[var(--color-brand)] font-medium"
                  >
                    {t("nav.signup")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
