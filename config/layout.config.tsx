import { MenuConfig } from "@/config/types";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart2,
  Store,
  Settings,
  Bell,
  Headphones,
  FileText,
  GitBranch,
} from "lucide-react";

export const MENU_SIDEBAR_MAIN: MenuConfig = [
  {
    children: [
      {
        title: 'nav.dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'nav.analytics',
        path: '#',
        icon: BarChart2,
      },
    ],
  }
];

export const MENU_SIDEBAR_RESOURCES: MenuConfig = [
  {
    title: 'nav.resources',
    children: [
      {
        title: 'nav.notifications',
        path: '#',
        icon: Bell,
      },
      {
        title: 'nav.settings',
        path: '#',
        icon: Settings,
      },
      {
        title: 'nav.helpCenter',
        path: '#',
        icon: Headphones,
      },
      {
        title: 'nav.documentation',
        path: '#',
        icon: FileText,
      },
    ],
  }
];

export const MENU_SIDEBAR_WORKSPACES: MenuConfig = [
  {
    title: 'nav.store',
    children: [
      {
        title: 'nav.myShop',
        path: '/shop',
        icon: Store,
      },
      {
        title: 'nav.branches',
        path: '/branches',
        icon: GitBranch,
      },
      {
        title: 'nav.orders',
        path: '#',
        icon: ShoppingCart,
      },
      {
        title: 'nav.products',
        path: '#',
        icon: Package,
      },
    ],
  }
];

export const MENU_TOOLBAR: MenuConfig = [
  {
    title: 'nav.overview',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
];
