'use client';

import { Layout14 } from '@/components/layout';
import { ReactNode, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ScreenLoader } from '@/components/screen-loader';
import { hadRecentSession, markAuthenticated } from '@/lib/session-cache';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const [isLoading, setIsLoading] = useState(status === 'loading');

  useEffect(() => {
    if (status === 'unauthenticated') {
      // "unauthenticated" while offline is a false-positive:
      // /api/auth/session is simply unreachable, not the session is invalid.
      // Only redirect when the browser confirms we're online OR there is no
      // recent session record (first visit / never signed in).
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (!isOnline && hadRecentSession()) {
        // Offline with a valid cached session — keep the user on the page
        setIsLoading(false);
        return;
      }
      router.push(`/${locale}/signin`);
      return;
    }

    if (status === 'authenticated') {
      markAuthenticated(session?.user?.shopId ?? null);
      setIsLoading(false);
      return;
    }
  }, [status, session, router, locale]);

  // Keep authenticated users on the page during locale swaps while NextAuth refreshes status.
  useEffect(() => {
    if (status === 'loading' && hadRecentSession()) {
      setIsLoading(false);
    }
  }, [status]);

  // Safety valve: if the session is stuck on 'loading' (fetch never rejects,
  // e.g. captive portal or DevTools Offline blocking localhost), unblock after
  // 4 s when we have evidence the user was recently authenticated.
  useEffect(() => {
    if (status !== 'loading') return;
    const timer = setTimeout(() => {
      if (hadRecentSession()) setIsLoading(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [status]);

  const shouldShowLoader = (status === 'loading' && !hadRecentSession()) || isLoading;
  if (shouldShowLoader) return <ScreenLoader />;

  return <Layout14>{children}</Layout14>;
}
