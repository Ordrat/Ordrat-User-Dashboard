import {
  Search,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Bell,
  Maximize,
  Minimize,
} from "lucide-react";
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input, InputWrapper } from "@/components/ui/input";
import { useLayout } from "./context";
import {
  Avatar,
  AvatarFallback,
  AvatarIndicator,
  AvatarStatus,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import { clearSwApiCache } from '@/hooks/use-sw-cache-clear';
import { clearSessionCache } from '@/lib/session-cache';
import { clearQueue } from '@/lib/offline-db';
import { useParams } from "next/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { useTranslation } from "react-i18next";
import { useMounted } from '@/hooks/use-mounted';

export function HeaderToolbar() {
  const { isMobile } = useLayout();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const { data: session } = useSession();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const { t } = useTranslation('common');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const userName = session?.user?.name ?? 'User';
  const userEmail = session?.user?.email ?? '';
  const initials = userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const handleInputChange = () => {};

  useEffect(() => {
    const fullscreenDocument = document as Document & {
      webkitFullscreenElement?: Element | null;
    };

    const syncFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || fullscreenDocument.webkitFullscreenElement));
    };

    syncFullscreen();

    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen as EventListener);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen as EventListener);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  async function toggleFullscreen() {
    const fullscreenDocument = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
      webkitFullscreenElement?: Element | null;
    };

    if (document.fullscreenElement || fullscreenDocument.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return;
      }

      await fullscreenDocument.webkitExitFullscreen?.();
      return;
    }

    const root = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };

    if (root.requestFullscreen) {
      await root.requestFullscreen();
      return;
    }

    await root.webkitRequestFullscreen?.();
  }

  return (
    <nav className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
      <Button
        mode="icon"
        variant="ghost"
        onClick={toggleFullscreen}
        className="text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-foreground focus-visible:bg-zinc-200 dark:focus-visible:bg-zinc-800 focus-visible:text-foreground"
        aria-label={isFullscreen ? t('actions.exitFullscreen') : t('actions.enterFullscreen')}
        title={isFullscreen ? t('actions.exitFullscreen') : t('actions.enterFullscreen')}
      >
        {isFullscreen ? <Minimize className="size-4.5" /> : <Maximize className="size-4.5" />}
      </Button>
      
      <Button
        mode="icon"
        variant="ghost"
        className="text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-foreground focus-visible:bg-zinc-200 dark:focus-visible:bg-zinc-800 focus-visible:text-foreground"
      >
        <Bell className="size-4.5" />
      </Button>

      


      <LanguageSwitcher />

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'light' ? t('theme.dark') : t('theme.light')}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-foreground focus-visible:outline-hidden focus-visible:bg-zinc-200 dark:focus-visible:bg-zinc-800 focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
      >
        {mounted ? (
          theme === 'light' ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />
        ) : (
          <span aria-hidden className="size-4" />
        )}
      </button>
      {!isMobile && (
        <InputWrapper className="w-full lg:w-40">
          <Search />
          <Input type="search" placeholder={t('header.search')} onChange={handleInputChange} />
        </InputWrapper>
      )}
      {/* User Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer">
          <Avatar className="size-7">
            <AvatarFallback>{initials}</AvatarFallback>
            <AvatarIndicator className="-inset-e-2 -top-2">
              <AvatarStatus variant="online" className="size-2.5" />
            </AvatarIndicator>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56 max-w-72" side="bottom" align="end" sideOffset={11}>
          {/* User Information Section */}
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="shrink-0">
              <AvatarFallback>{initials}</AvatarFallback>
              <AvatarIndicator className="-inset-e-1.5 -top-1.5">
                <AvatarStatus variant="online" className="size-2.5" />
              </AvatarIndicator>
            </Avatar>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-semibold text-foreground truncate max-w-full">{userName}</span>
              <span className="text-xs text-muted-foreground truncate max-w-full">{userEmail}</span>
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem>
            <User/>
            <span>{t('header.profile')}</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Settings/>
            <span>{t('header.settings')}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={async () => {
            clearSwApiCache();
            clearSessionCache();
            await clearQueue();
            signOut({ callbackUrl: `/${locale}/signin` });
          }}>
            <LogOut/>
            <span>{t('header.signOut')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
