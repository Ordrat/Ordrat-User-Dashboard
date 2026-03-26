'use client';

import { Layout14 } from '@/components/layout';
import { ReactNode, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { ScreenLoader } from '@/components/screen-loader';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/signin`);
      return;
    }
    if (status === 'authenticated') {
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [status, router, locale]);

  if (status === 'loading' || isLoading) {
    return <ScreenLoader />;
  }

  return <Layout14>{children}</Layout14>;
}
