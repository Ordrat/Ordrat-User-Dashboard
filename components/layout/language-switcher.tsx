'use client';

import { useTranslation } from 'react-i18next';
import { useRouter, usePathname } from 'next/navigation';
import { changeLanguage, type AppLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const isArabic = i18n.language === 'ar';
  const nextLang: AppLanguage = isArabic ? 'en' : 'ar';

  function handleToggle() {
    changeLanguage(nextLang);
    const segments = pathname.split('/');
    segments[1] = nextLang;
    router.push(segments.join('/'));
  }

  return (
    <Button variant="outline" onClick={handleToggle} className="h-9 gap-1.5 px-2.5 text-sm font-medium">
      <Languages className="size-5" />
      {isArabic ? (
        <span>English</span>
      ) : (
        <span style={{ fontFamily: 'var(--font-tajawal)' }}>العربية</span>
      )}
    </Button>
  );
}
