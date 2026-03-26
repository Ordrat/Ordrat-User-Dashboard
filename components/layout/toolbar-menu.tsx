import { useMenu } from "@/hooks/use-menu";
import { cn } from "@/lib/utils";
import { MENU_TOOLBAR } from "@/config/layout.config";
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

export function ToolbarMenu() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const { t } = useTranslation('common');
  const pathWithoutLocale = stripLocale(pathname);
  const { isActive } = useMenu(pathWithoutLocale);

  return (
    <div className="flex items-stretch">
      <nav className="list-none flex items-stretch gap-2">
        {MENU_TOOLBAR.map((item, index) => {
          const active = isActive(item.path);
          const href = item.path && item.path !== '#'
            ? `/${locale}${item.path}`
            : '#';

          return (
            <Button 
              key={index}
              size="sm"
              variant="ghost"
              className={cn(
                "inline-flex items-center text-sm font-medium",
                active 
                  ? "bg-muted text-foreground" 
                  : "text-secondary-foreground hover:text-primary"
              )}
              asChild
            >
              <Link href={href}>
                {item.icon && <item.icon className="me-2" />}
                {t(item.title ?? '')}
              </Link>
            </Button>
          )
        })}
      </nav>
    </div>
  );
}
