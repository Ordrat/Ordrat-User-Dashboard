import { useCallback } from "react";
import { MENU_SIDEBAR_WORKSPACES } from "@/config/layout.config";
import {
  AccordionMenu,
  AccordionMenuIndicator,
  AccordionMenuSub,
  AccordionMenuSubTrigger,
  AccordionMenuSubContent,
  AccordionMenuItem,
} from '@/components/ui/accordion-menu';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus } from "lucide-react";
import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function SidebarWorkspacesMenu() {
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
      selectedValue="workspace-trigger"
      matchPath={matchPath}
      type="single"
      collapsible
      defaultValue="workspace-trigger"
      className="space-y-7.5 px-2.5"
      classNames={{
        item: 'h-8.5 px-2.5 text-sm font-normal text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-foreground focus-visible:bg-zinc-200 dark:focus-visible:bg-zinc-800 focus-visible:text-foreground data-[selected=true]:bg-brand data-[selected=true]:text-brand-foreground [&[data-selected=true]_svg]:opacity-100',
        subTrigger: 'text-xs font-normal text-muted-foreground hover:bg-transparent group [&_[data-slot="accordion-menu-sub-indicator"]]:hidden',
        subContent: 'ps-0',
        subWrapper: 'space-y-1',
        indicator: 'ms-auto flex items-center font-medium',
      }}
    >
      {MENU_SIDEBAR_WORKSPACES.map((item, index) => (
        <AccordionMenuSub key={index} value="workspaces">
          <AccordionMenuSubTrigger value="workspace-trigger">
            <span>{item.title ? t(item.title) : null}</span>
            <AccordionMenuIndicator>
              <Plus className="size-3.5 shrink-0 transition-transform duration-200 hidden group-data-[state=open]:block" />
              <Minus className="size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:hidden" />
            </AccordionMenuIndicator>
          </AccordionMenuSubTrigger>

          <AccordionMenuSubContent type="single" collapsible parentValue="workspace-trigger">
            {item.children?.map((child, childIndex) => {
              const href = child.path && child.path !== '#'
                ? `/${locale}${child.path}`
                : '#';
              return (
                <AccordionMenuItem key={childIndex} value={href}>
                  <Link href={href}>
                    {child.icon && <child.icon />}
                    <span>{t(child.title ?? '')}</span>
                    {child.badge == 'Pro' && <Badge size="sm" variant="success" appearance="light">{child.badge}</Badge>}
                  </Link>
                </AccordionMenuItem>
              );
            })}
          </AccordionMenuSubContent>
        </AccordionMenuSub>
      ))}
    </AccordionMenu>
  );
}
