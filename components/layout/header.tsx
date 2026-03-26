'use client';

import { HeaderBreadcrumbs } from './header-breadcrumbs';
import { HeaderLogo } from './header-logo';
import { HeaderToolbar } from './header-toolbar';
import { useLayout } from './context';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';

export function Header() {
  const { isMobile } = useLayout();
  const { isOffline } = useOnlineStatus();
  const { t } = useTranslation('common');

  return (
    <header className="flex items-stretch fixed z-10 top-0 start-0 end-0 shrink-0 bg-background/95 border-b border-border backdrop-blur-sm supports-backdrop-filter:bg-background/60 h-(--header-height-mobile) lg:h-(--header-height) pe-[var(--removed-body-scroll-bar-size,0px)]">
      <div className="@container grow pe-5 flex items-stretch justify-between gap-2.5">
        <div className="flex items-stretch gap-x-6">
          <HeaderLogo />
          {!isMobile && <HeaderBreadcrumbs />}
        </div>
        {isOffline && (
          <div className="flex items-center">
            <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/15 text-yellow-600 dark:text-yellow-500 border border-yellow-500/30 px-3 py-1 text-xs font-medium">
              <WifiOff className="size-3 shrink-0" />
              <span className="hidden sm:inline">{t('pwa.offline_banner')}</span>
            </div>
          </div>
        )}
        <HeaderToolbar />
      </div>
    </header>
  );
}
