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
  Building2,
  CreditCard,
  UtensilsCrossed,
  Phone,
  ClipboardList,
  QrCode,
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
    title: 'nav.storeSettings',
    children: [
      {
        title: 'nav.basicData',
        path: '/store-settings/basic-data',
        icon: Store,
      },
      {
        title: 'nav.branches',
        path: '/store-settings/branches',
        icon: Building2,
      },
      {
        title: 'nav.paymentGateways',
        path: '/store-settings/payment-gateways',
        icon: CreditCard,
      },
      {
        title: 'nav.tables',
        path: '/store-settings/tables',
        icon: UtensilsCrossed,
      },
      {
        title: 'nav.contactInfo',
        path: '/store-settings/contact-info',
        icon: Phone,
      },
      {
        title: 'nav.logs',
        path: '/store-settings/logs',
        icon: ClipboardList,
      },
      {
        title: 'nav.qrCode',
        path: '/store-settings/qr-code',
        icon: QrCode,
      },
    ],
  },
  {
    title: 'nav.store',
    children: [
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
  },
];

export const MENU_TOOLBAR: MenuConfig = [
  {
    title: 'nav.overview',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
];
