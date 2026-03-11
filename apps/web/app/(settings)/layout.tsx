'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const sidebarLinks = [
  { href: '/settings/profile', label: 'Profile' },
  { href: '/settings/account', label: 'Account' },
  { href: '/settings/preferences', label: 'Preferences' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto w-full py-8 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Nav */}
          <div className="w-full md:w-52 shrink-0">
            <nav className="space-y-0.5">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--color-bg-hover)] text-[var(--color-text)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          {/* Content area */}
          <div className="flex-1">{children}</div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
