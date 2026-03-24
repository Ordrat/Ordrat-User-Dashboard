'use client';

import { toAbsoluteUrl } from '@/lib/helpers';

export function ScreenLoader() {
  return (
    <div className="flex flex-col items-center gap-2 justify-center fixed inset-0 z-50 transition-opacity duration-700 ease-in-out">
      <img
        className="dark:hidden h-[30px] max-w-none"
        src={toAbsoluteUrl('/media/app/logo.svg')}
        alt="Ordrat"
      />
      <img
        className="hidden dark:block h-[30px] max-w-none"
        src={toAbsoluteUrl('/media/app/logo-dark.png')}
        alt="Ordrat"
      />
      <div className="text-muted-foreground font-medium text-sm">
        Loading...
      </div>
    </div>
  );
}
