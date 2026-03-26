import { Fragment, ReactNode } from 'react';
import { MENU_SIDEBAR_MAIN, MENU_SIDEBAR_WORKSPACES, MENU_SIDEBAR_RESOURCES } from '@/config/layout.config';
import { useMenu } from '@/hooks/use-menu';
import { MenuItem } from '@/config/types';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const LOCALES = ['en', 'ar'];

function stripLocale(pathname: string): string {
  const segments = pathname.split('/');
  if (segments.length > 1 && LOCALES.includes(segments[1])) {
    return '/' + segments.slice(2).join('/') || '/';
  }
  return pathname;
}

export interface ToolbarHeadingProps {
  title?: string | ReactNode;
  description?: string | ReactNode;
}

function Toolbar({ children }: { children?: ReactNode }) {
  return (
    <div className="py-2.5 lg:py-0 lg:fixed top-(--header-height) start-[calc(var(--sidebar-width))] lg:in-data-[sidebar-open=false]:start-[calc(var(--sidebar-collapsed-width))] transition-all duration-300 end-0 z-10 px-5 flex flex-wrap items-center justify-between gap-2.5 min-h-(--toolbar-height) bg-background border-b border-border shrink-0">
      {children}
    </div>
  );
}

function ToolbarActions({ children }: { children?: ReactNode }) {
  return <div className="flex items-center gap-2.5">{children}</div>;
}

function ToolbarBreadcrumbs() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const { t } = useTranslation('common');
  const pathWithoutLocale = stripLocale(pathname);
  const { getBreadcrumb } = useMenu(pathWithoutLocale);
  const allMenus = [...MENU_SIDEBAR_MAIN, ...MENU_SIDEBAR_WORKSPACES, ...MENU_SIDEBAR_RESOURCES];
  const items: MenuItem[] = getBreadcrumb(allMenus);

  if (items.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/${locale}/dashboard`}>{t('nav.home')}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const href = item.path && item.path !== '#'
            ? `/${locale}${item.path}`
            : '#';

          return (
            <Fragment key={index}>
              <BreadcrumbSeparator className="text-xs text-muted-foreground">/</BreadcrumbSeparator>
              <BreadcrumbItem>
                {!isLast ? (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{t(item.title ?? '')}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{t(item.title ?? '')}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function ToolbarHeading ({ children }: { children: ReactNode }) {
  return <div className="flex flex-col md:flex-row md:items-center flex-wrap gap-1 lg:gap-5">{children}</div>;
}

function ToolbarPageTitle ({ children }: { children?: string }) {
  const pathname = usePathname();
  const { t } = useTranslation('common');
  const pathWithoutLocale = stripLocale(pathname);
  const { getCurrentItem } = useMenu(pathWithoutLocale);
  const allMenus = [...MENU_SIDEBAR_MAIN, ...MENU_SIDEBAR_WORKSPACES, ...MENU_SIDEBAR_RESOURCES];
  const item = getCurrentItem(allMenus);

  return (
    <h1 className="text-base font-medium leading-none text-foreground">
      {children ? children : item?.title ? t(item.title) : ''}
    </h1>
  );
};

function ToolbarDescription ({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
      {children}
    </div>
  );
};

function ToolbarPageHeading() {
  const pathname = usePathname();
  const { t } = useTranslation('common');
  const pathWithoutLocale = stripLocale(pathname);
  const { getCurrentItem } = useMenu(pathWithoutLocale);
  const allMenus = [...MENU_SIDEBAR_MAIN, ...MENU_SIDEBAR_WORKSPACES, ...MENU_SIDEBAR_RESOURCES];
  const item = getCurrentItem(allMenus);

  if (!item) return null;

  return (
    <div className="flex items-center gap-2">
      {item.icon && <item.icon className="size-4 text-muted-foreground" />}
      <h1 className="text-sm font-medium leading-none text-foreground">
        {item.title ? t(item.title) : ''}
      </h1>
    </div>
  );
}

export {
  Toolbar,
  ToolbarActions,
  ToolbarBreadcrumbs,
  ToolbarHeading,
  ToolbarPageHeading,
  ToolbarPageTitle,
  ToolbarDescription
};
