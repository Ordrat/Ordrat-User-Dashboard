'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function UnauthorizedPage() {
  const { t } = useTranslation('common');
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">{t('unauthorized.title')}</h1>
      <p className="text-sm text-muted-foreground">
        {t('unauthorized.description')}
      </p>
      <Button asChild variant="outline">
        <Link href={`/${locale}/dashboard`}>{t('actions.goToDashboard')}</Link>
      </Button>
    </div>
  );
}
