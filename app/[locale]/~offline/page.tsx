'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const { t } = useTranslation('common');

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      {/* Ambient rings */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        aria-hidden="true"
      >
        <div className="h-150 w-150 rounded-full border border-border/20 animate-[ping_4s_ease-in-out_infinite] opacity-20" />
        <div className="absolute h-105 w-105 rounded-full border border-border/30 animate-[ping_4s_ease-in-out_infinite_1s] opacity-15" />
        <div className="absolute h-65 w-65 rounded-full border border-border/40 animate-[ping_4s_ease-in-out_infinite_2s] opacity-10" />
      </div>

      {/* Content card */}
      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <img
            src="/media/app/logo.svg"
            alt="Ordrat"
            className="h-10 w-auto dark:hidden opacity-90"
          />
          <img
            src="/media/app/logo-dark.png"
            alt="Ordrat"
            className="hidden h-10 w-auto dark:block opacity-90"
          />
        </div>

        {/* Icon */}
        <div className="relative flex items-center justify-center">
          <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center shadow-inner">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-3 max-w-xs">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t('pwa.offline_fallback_title')}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('pwa.offline_fallback_description')}
          </p>
        </div>

        {/* Action */}
        <Button
          onClick={() => window.location.reload()}
          className="min-w-35"
        >
          {t('pwa.offline_fallback_retry')}
        </Button>
      </div>
    </div>
  );
}
