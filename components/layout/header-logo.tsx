'use client';

import { useEffect, useState } from 'react';
import { Menu, PanelRight } from 'lucide-react';
import { useLayout } from './context';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SidebarPrimary } from './sidebar-primary';
import { SidebarSecondary } from '../sidebar-secondary';
import { toAbsoluteUrl } from '@/lib/helpers';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

export function HeaderLogo() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const { isMobile, sidebarToggle } = useLayout();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Close sheet when route changes
  useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  return (
    <div className="flex lg:border-e border-border items-center gap-2 grow lg:grow-0 lg:w-(--sidebar-width)">
      {/* Brand */}
      <div className="flex items-center w-full">
        {/* Logo icon — collapsed sidebar */}
        <div className="flex items-center justify-center shrink-0 border-e border-border w-(--sidebar-collapsed-width) h-(--header-height) bg-background">
          <Link href={`/${locale}/dashboard`}>
            <img
              src={toAbsoluteUrl('/media/app/logo.svg')}
              className="dark:hidden h-7 w-auto"
              alt="Ordrat"
            />
            <img
              src={toAbsoluteUrl('/media/app/logo-dark.png')}
              className="hidden dark:block h-7 w-auto"
              alt="Ordrat"
            />
          </Link>
        </div>

        {/* Mobile sidebar toggle */}
        {isMobile && (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" mode="icon" size="sm" className="ms-4">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              className="p-0 gap-0 w-[280px] lg:w-(--sidebar-width)"
              side="left"
              close={false}
            >
              <SheetHeader className="p-0 space-y-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
              </SheetHeader>
              <SheetBody className="flex grow p-0 overflow-hidden">
                <SidebarPrimary />
                <SidebarSecondary />
              </SheetBody>
            </SheetContent>
          </Sheet>
        )}

        {/* Sidebar header — logo + toggle */}
        <div className="hidden lg:flex w-full grow items-center justify-between px-5 gap-2.5">
          <Link href={`/${locale}/dashboard`} className="flex items-center">
            <img
              src={toAbsoluteUrl('/media/app/default-logo.svg')}
              className="dark:hidden h-10 w-auto"
              alt="Ordrat"
            />
            <img
              src={toAbsoluteUrl('/media/app/default-logo-dark.svg')}
              className="hidden dark:block h-10 w-auto"
              alt="Ordrat"
            />
          </Link>

          {/* Sidebar toggle */}
          <Button
            mode="icon"
            variant="ghost"
            onClick={sidebarToggle}
            className="hidden lg:inline-flex text-muted-foreground hover:text-foreground"
          >
            <PanelRight className="-rotate-180 in-data-[sidebar-open=false]:rotate-0 rtl:rotate-0 rtl:in-data-[sidebar-open=false]:-rotate-180 opacity-100" />
          </Button>
        </div>
      </div>
    </div>
  );
}
