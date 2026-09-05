"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "@/lib/i18n";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const sidebarLinks = [
    { href: "/settings/profile", label: t("settings.profile") },
    { href: "/settings/account", label: t("settings.account") },
    { href: "/settings/preferences", label: t("settings.preferences") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto w-full py-8 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-52 shrink-0">
            <nav className="space-y-0.5">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-bg-hover text-text"
                        : "text-text-secondary hover:text-text hover:bg-bg-hover"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-1">{children}</div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
