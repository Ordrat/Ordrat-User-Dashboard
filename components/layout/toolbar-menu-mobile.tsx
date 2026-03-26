import { useMenu } from "@/hooks/use-menu";
import { Menu } from "lucide-react";
import { MENU_TOOLBAR } from "@/config/layout.config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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

export function ToolbarMenuMobile() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const { t } = useTranslation('common');
  const pathWithoutLocale = stripLocale(pathname);
  const { isActive } = useMenu(pathWithoutLocale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start">
          <Menu /> {t('toolbar.pageMenu')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
        {MENU_TOOLBAR.map((item, index) => {
          const active = isActive(item.path);
          const href = item.path && item.path !== '#'
            ? `/${locale}${item.path}`
            : '#';

          return (
            <DropdownMenuItem
              key={index}
              asChild
              {...(active && { 'data-here': 'true' })}
            >
              <Link href={href} className="flex items-center gap-2">
                {item.icon && <item.icon />}
                {t(item.title ?? '')}
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
