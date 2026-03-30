import { Fragment, ReactNode } from 'react';
import { MENU_SIDEBAR_MAIN, MENU_SIDEBAR_WORKSPACES, MENU_SIDEBAR_RESOURCES } from '@/config/layout.config';
import { useMenu } from '@/hooks/use-menu';
import { MenuItem } from '@/config/types';
import { useLayout } from './context';
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
    <div className="py-2.5 lg:py-0 lg:fixed top-(--header-height) start-[calc(var(--sidebar-width))] lg:in-data-[sidebar-open=false]:start-[calc(var(--sidebar-collapsed-width))] transition-all duration-300 end-0 z-10 px-5 flex flex-wrap items-center justify-between gap-2.5 min-h-(--toolbar-height) bg-muted border-b border-border shrink-0">
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
  const { pageTitle } = useLayout();
  const pathWithoutLocale = stripLocale(pathname);
  const { getBreadcrumb } = useMenu(pathWithoutLocale);
  const allMenus = [...MENU_SIDEBAR_MAIN, ...MENU_SIDEBAR_WORKSPACES, ...MENU_SIDEBAR_RESOURCES];
  const items: MenuItem[] = getBreadcrumb(allMenus).filter((item) => Boolean(item.title));
  const shouldShowHome = pathWithoutLocale !== '/dashboard';

  if (items.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {shouldShowHome && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/${locale}/dashboard`}>{t('nav.dashboard')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isNavigable = Boolean(item.path && item.path !== '#');
          const href = isNavigable
            ? `/${locale}${item.path}`
            : '#';
          const label = isLast && pageTitle ? pageTitle : t(item.title ?? '');

          return (
            <Fragment key={index}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {!isLast && isNavigable ? (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                ) : !isLast ? (
                  <span className="text-muted-foreground">{label}</span>
                ) : (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
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
