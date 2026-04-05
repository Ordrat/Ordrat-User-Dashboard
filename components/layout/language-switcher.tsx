'use client';

import { useTranslation } from 'react-i18next';
import { useRouter, usePathname } from 'next/navigation';
import { changeLanguage, type AppLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const isArabic = i18n.language === 'ar';
  const nextLang: AppLanguage = isArabic ? 'en' : 'ar';

  function handleToggle() {
    changeLanguage(nextLang);
    const segments = pathname.split('/');
    segments[1] = nextLang;
    router.replace(segments.join('/'));
  }

  return (
    <Button
      variant="ghost"
      mode="icon"
      onClick={handleToggle}
      aria-label={t('language.switchTo')}
      title={t('language.switchTo')}
      className="text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-foreground focus-visible:bg-zinc-200 dark:focus-visible:bg-zinc-800 focus-visible:text-foreground"
    >
      <Languages className="size-4.5" />
    </Button>
  );
}
