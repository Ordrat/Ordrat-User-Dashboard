import {
  Search,
  Coffee,
  MessageSquareCode,
  Pin,
  ClipboardList,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Plus,
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

export function HeaderToolbar() {
  const { isMobile } = useLayout();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  const userName = session?.user?.name ?? 'User';
  const userEmail = session?.user?.email ?? '';
  const initials = userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const handleInputChange = () => {};

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <nav className="flex items-center gap-2.5">
      <Button mode="icon" variant="outline"><Coffee /></Button>
      <Button mode="icon" variant="outline"><MessageSquareCode /></Button>
      <Button mode="icon" variant="outline"><Pin /></Button>

      {!isMobile && (
        <InputWrapper className="w-full lg:w-40">
          <Search />
          <Input type="search" placeholder="Search" onChange={handleInputChange} />
        </InputWrapper>
      )}

      {isMobile ? (
        <>
          <Button variant="outline" mode="icon"><ClipboardList /></Button>
          <Button variant="mono" mode="icon"><Plus /></Button>
        </>
      ) : (
        <>
          <Button variant="outline"><ClipboardList /> Reports</Button>
          <Button variant="mono"><Plus /> Add</Button>
        </>
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
        <DropdownMenuContent className="w-56" side="bottom" align="end" sideOffset={11}>
          {/* User Information Section */}
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
              <AvatarIndicator className="-end-1.5 -top-1.5">
                <AvatarStatus variant="online" className="size-2.5" />
              </AvatarIndicator>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-foreground">{userName}</span>
              <span className="text-xs text-muted-foreground">{userEmail}</span>
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem>
            <User/>
            <span>Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Settings/>
            <span>Settings</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={toggleTheme}>
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/signin' })}>
            <LogOut/>
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
