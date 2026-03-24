import { MenuConfig } from "@/config/types";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart2,
  Store,
  Settings,
  Bell,
  Headphones,
  FileText,
  Tag,
  Truck,
} from "lucide-react";

export const MENU_SIDEBAR_MAIN: MenuConfig = [
  {
    children: [
      {
        title: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Orders',
        path: '#',
        icon: ShoppingCart,
      },
      {
        title: 'Products',
        path: '#',
        icon: Package,
      },
      {
        title: 'Customers',
        path: '#',
        icon: Users,
      },
      {
        title: 'Analytics',
        path: '#',
        icon: BarChart2,
      },
    ],
  }
];

export const MENU_SIDEBAR_RESOURCES: MenuConfig = [
  {
    title: 'Resources',
    children: [
      {
        title: 'Help Center',
        path: '#',
        icon: Headphones,
      },
      {
        title: 'Documentation',
        path: '#',
        icon: FileText,
      },
    ],
  }
];

export const MENU_SIDEBAR_WORKSPACES: MenuConfig = [
  {
    title: 'Store',
    children: [
      {
        title: 'My Store',
        path: '#',
        icon: Store,
      },
      {
        title: 'Promotions',
        path: '#',
        icon: Tag,
      },
      {
        title: 'Shipping',
        path: '#',
        icon: Truck,
      },
      {
        title: 'Notifications',
        path: '#',
        icon: Bell,
      },
      {
        title: 'Settings',
        path: '#',
        icon: Settings,
      },
    ],
  }
];

export const MENU_TOOLBAR: MenuConfig = [
  {
    title: 'Overview',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
];
