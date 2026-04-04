import { useCallback } from "react";
import { MENU_SIDEBAR_MAIN } from "@/config/layout.config";
import {
  AccordionMenu,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuLabel
} from '@/components/ui/accordion-menu';
import { Badge } from '@/components/ui/badge';
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function SidebarPrimaryMenu() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const { t } = useTranslation('common');

  // Memoize matchPath to prevent unnecessary re-renders
  const matchPath = useCallback(
    (path: string): boolean => {
      // path already has locale prefix when rendered
      return path === pathname || (path.length > 1 && pathname.startsWith(path) && !path.endsWith('/dashboard'));
    },
    [pathname],
  );

  return (
    <AccordionMenu
      selectedValue={pathname}
      matchPath={matchPath}
      type="multiple"
      className="space-y-7.5 px-2.5"
      classNames={{
        label: 'text-xs font-normal text-muted-foreground mb-2',
        item: 'h-8.5 px-2.5 text-sm font-normal text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-foreground focus-visible:bg-zinc-200 dark:focus-visible:bg-zinc-800 focus-visible:text-foreground data-[selected=true]:bg-brand data-[selected=true]:text-brand-foreground [&[data-selected=true]_svg]:opacity-100',
        group: 'space-y-1',
      }}
    >
      {MENU_SIDEBAR_MAIN.map((item, index) => {
        return (
          <AccordionMenuGroup key={index}>
            <AccordionMenuLabel>
              {item.title ? t(item.title) : null}
            </AccordionMenuLabel>
            {item.children?.map((child, childIndex) => {
              const href = child.path && child.path !== '#'
                ? `/${locale}${child.path}`
                : '#';
              return (
                <AccordionMenuItem key={childIndex} value={href}>
                  <Link href={href}>
                    {child.icon && <child.icon />}
                    <span>{t(child.title ?? '')}</span>
                    {child.badge == 'Beta' && <Badge size="sm" variant="destructive" appearance="light">{child.badge}</Badge>}
                  </Link>
                </AccordionMenuItem>
              )
            })}
          </AccordionMenuGroup>
        )
      })}
    </AccordionMenu>
  );
}
