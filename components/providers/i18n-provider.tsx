'use client';

import { useEffect, useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Direction } from 'radix-ui';
import { useParams } from 'next/navigation';
import i18n, { changeLanguage, type AppLanguage } from '@/lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const locale = (params?.locale as string) ?? undefined;

  const lang: AppLanguage = useMemo(() => {
    if (locale === 'ar' || locale === 'en') return locale;
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('ordrat-language') as AppLanguage) ?? 'en';
    }
    return 'en';
  }, [locale]);

  useEffect(() => {
    if (i18n.language !== lang) {
      changeLanguage(lang);
    } else {
      // Ensure DOM attributes are set even if language matches
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      document.documentElement.classList.toggle('font-arabic', lang === 'ar');
    }
  }, [lang]);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <Direction.DirectionProvider dir={dir}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </Direction.DirectionProvider>
  );
}
