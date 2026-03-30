'use client';

import { HeaderBreadcrumbs } from './header-breadcrumbs';
import { HeaderLogo } from './header-logo';
import { HeaderToolbar } from './header-toolbar';
import { useLayout } from './context';
import { OfflineProgressBar } from '@/components/pwa/offline-progress-bar';

export function Header() {
  const { isMobile } = useLayout();

  return (
    <header className="flex items-stretch fixed z-10 top-0 inset-s-0 inset-e-0 shrink-0 bg-muted/95 border-b border-border backdrop-blur-sm supports-backdrop-filter:bg-muted/60 h-(--header-height-mobile) lg:h-(--header-height) pe-(--removed-body-scroll-bar-size,0px)">
      <div className="@container grow min-w-0 pe-5 flex items-stretch justify-between gap-2.5">
        <div className="flex items-stretch gap-x-6">
          <HeaderLogo />
          {!isMobile && <HeaderBreadcrumbs />}
        </div>
        <HeaderToolbar />
      </div>

      {/* Thin progress stripe at the very bottom of the header — always visible */}
      <OfflineProgressBar />
    </header>
  );
}
