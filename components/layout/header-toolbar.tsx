import {
  Search,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Bell,
} from "lucide-react";
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

export function HeaderToolbar() {
  const { isMobile } = useLayout();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const { t } = useTranslation('common');

  const userName = session?.user?.name ?? 'User';
  const userEmail = session?.user?.email ?? '';
  const initials = userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const handleInputChange = () => {};

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <nav className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

      <Button mode="icon" variant="outline">
        <Bell />
      </Button>


      <LanguageSwitcher />

      <Button mode="icon" variant="outline" onClick={toggleTheme}>
        {theme === 'light' ? <Moon /> : <Sun />}
      </Button>
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
            <AvatarIndicator className="-end-2 -top-2">
              <AvatarStatus variant="online" className="size-2.5" />
            </AvatarIndicator>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56 max-w-72" side="bottom" align="end" sideOffset={11}>
          {/* User Information Section */}
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="shrink-0">
              <AvatarFallback>{initials}</AvatarFallback>
              <AvatarIndicator className="-end-1.5 -top-1.5">
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
