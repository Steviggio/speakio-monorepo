'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && user && user.isOnboardingCompleted === false) {
      if (!pathname.startsWith('/onboarding')) {
        router.push('/onboarding');
      }
    }
  }, [isLoading, user, pathname, router]);

  if (!isLoading && user && user.isOnboardingCompleted === false && !pathname.startsWith('/onboarding')) {
    // Return null while redirecting to avoid flashing the protected layout
    return null; 
  }

  return <>{children}</>;
}
