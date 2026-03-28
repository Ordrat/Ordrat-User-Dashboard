import { useLayout } from './context';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Toolbar, ToolbarActions, ToolbarHeading, ToolbarPageHeading } from './toolbar';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { HeaderBreadcrumbs } from './header-breadcrumbs';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';
import { useMenu } from '@/hooks/use-menu';
import { MENU_SIDEBAR_MAIN, MENU_SIDEBAR_WORKSPACES, MENU_SIDEBAR_RESOURCES } from '@/config/layout.config';

const LOCALES = ['en', 'ar'];

function stripLocale(pathname: string): string {
  const segments = pathname.split('/');
  if (segments.length > 1 && LOCALES.includes(segments[1])) {
    return '/' + segments.slice(2).join('/') || '/';
  }
  return pathname;
}

export function Wrapper({ children }: { children: React.ReactNode }) {
  const { isMobile, pageTitle, pageLogo } = useLayout();
  const { t } = useTranslation('common');
  const [enableTransitions, setEnableTransitions] = useState(false);
  const pathname = usePathname();
  const pathWithoutLocale = stripLocale(pathname);
  const { getCurrentItem } = useMenu(pathWithoutLocale);
  const allMenus = [...MENU_SIDEBAR_MAIN, ...MENU_SIDEBAR_WORKSPACES, ...MENU_SIDEBAR_RESOURCES];
  const currentItem = getCurrentItem(allMenus);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEnableTransitions(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <Header />
      {!isMobile && <Sidebar />}

      <div className={cn(
        'grow overflow-x-hidden overflow-y-auto pt-(--header-height-mobile) lg:pt-[calc(var(--header-height)+var(--toolbar-height))] lg:ps-(--sidebar-width) lg:in-data-[sidebar-open=false]:ps-(--sidebar-collapsed-width) duration-300',
        enableTransitions ? 'transition-all duration-300' : 'transition-none'
      )}>
        <Toolbar>
          <ToolbarHeading>
            {pageTitle ? (
              <div className="flex items-center gap-3">
                {pageLogo ? (
                  <img src={pageLogo} alt="" className="h-7 w-7 rounded-md object-cover border" />
                ) : currentItem?.icon ? (
                  <currentItem.icon className="size-5 text-muted-foreground" />
                ) : null}
                <h1 className="text-sm font-medium leading-none text-foreground">{pageTitle}</h1>
              </div>
            ) : (
              <ToolbarPageHeading />
            )}
          </ToolbarHeading>
          <ToolbarActions>
            <Button size="sm" variant="outline" mode="icon" aria-label={t('toolbar.search')}><Search /></Button>
          </ToolbarActions>
        </Toolbar>

        <main className="grow p-5 min-w-0 overflow-x-hidden" role="content">
          {isMobile && <HeaderBreadcrumbs />}
          {children}
        </main>
      </div>
    </>
  );
}
