'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '../lib/providers/AuthProvider';
import { I18nProvider } from '../lib/i18n';
import OnboardingGuard from '@/components/OnboardingGuard';

// Composes global providers: React Query, Auth, i18n, and onboarding guard around the app tree.
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <OnboardingGuard>
            {children}
          </OnboardingGuard>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
