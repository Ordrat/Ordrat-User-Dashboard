'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import {
  MENU_SIDEBAR_MAIN,
  MENU_SIDEBAR_WORKSPACES,
  MENU_SIDEBAR_RESOURCES,
} from '@/config/layout.config';
import type { MenuConfig } from '@/config/types';
import { ordratFetch } from '@/lib/api-client';
import {
  Shop,
  Branch,
  Currency,
  Theme,
  ShopPaymentGateway,
  ShopContactInfo,
} from '@/lib/ordrat-api/endpoints';
import { getSessionShopId } from '@/lib/session-cache';

// Map of dashboard route → API path(s) to pre-fetch for offline data caching.
// The SW's StaleWhileRevalidate rule for api.ordrat.com caches these responses.
// Add new entries here whenever a page gains a new API dependency.
const ROUTE_API_ENDPOINTS: Record<string, (shopId: string) => string[]> = {
  '/dashboard': () => [],  // skeleton placeholder — no static precache needed yet
  '/store-settings/basic-data': (shopId) => [
    Shop.GetById(shopId),
    Currency.GetAll.path,   // currency dropdown
    Theme.GetAll.path,      // theme dropdown
  ],
  '/store-settings/branches': (shopId) => [Branch.GetByShopId(shopId)],
  '/store-settings/payment-gateways': (shopId) => [ShopPaymentGateway.GetByShopId(shopId)],
  '/store-settings/tables': (shopId) => [Branch.GetByShopId(shopId)],  // branches needed for dropdown
  '/store-settings/contact-info': (shopId) => [ShopContactInfo.GetByShopId(shopId)],
  '/store-settings/logs': () => [],  // filter-driven — no static precache
  '/store-settings/qr-code': (shopId) => [Shop.GetById(shopId)],  // needs subdomain
};

export interface PrecacheState {
  isCaching: boolean;
  totalPages: number;
  cachedCount: number;
  failedCount: number;
  /** 0–1 progress value */
  progress: number;
}

function extractPaths(menus: MenuConfig): string[] {
  const paths: string[] = [];

  function walk(items: MenuConfig) {
    for (const item of items) {
      if (item.path && item.path !== '#') paths.push(item.path);
      if (item.children) walk(item.children);
    }
  }

  walk(menus);
  return Array.from(new Set(paths));
}

export function usePagePrecache() {
  const [state, setState] = useState<PrecacheState>({
    isCaching: false,
    totalPages: 0,
    cachedCount: 0,
    failedCount: 0,
    progress: 0,
  });
  const { t } = useTranslation('common');
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';

  const cacheAllPages = async () => {
    if (state.isCaching) return;

    const allMenus = [
      ...MENU_SIDEBAR_MAIN,
      ...MENU_SIDEBAR_WORKSPACES,
      ...MENU_SIDEBAR_RESOURCES,
    ];
    const paths = extractPaths(allMenus);

    if (paths.length === 0) {
      toast.info(t('pwa.cache_no_pages'));
      return;
    }

    setState({
      isCaching: true,
      totalPages: paths.length,
      cachedCount: 0,
      failedCount: 0,
      progress: 0,
    });

    const toastId = 'page-precache';
    toast.loading(t('pwa.cache_progress', { done: 0, total: paths.length }), {
      id: toastId,
    });

    let cachedCount = 0;
    let failedCount = 0;
    let storageExhausted = false;
    const shopId = getSessionShopId();

    for (const path of paths) {
      if (storageExhausted) {
        failedCount++;
        continue;
      }

      // 1. Cache the page shell (HTML / RSC payload) via SW cacheOnNavigation
      const url = `${window.location.origin}/${locale}${path}`;
      try {
        await fetch(url, { cache: 'no-cache' });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'QuotaExceededError') {
          storageExhausted = true;
          failedCount++;
          continue;
        }
        // Non-storage errors — still try API fetch below
      }

      // 2. Pre-fetch the API data for this route so the SW caches it.
      //    ordratFetch uses the current session token and hits api.ordrat.com,
      //    which the SW caches via its StaleWhileRevalidate rule.
      if (shopId) {
        const apiPaths = ROUTE_API_ENDPOINTS[path]?.(shopId) ?? [];
        for (const apiPath of apiPaths) {
          try {
            await ordratFetch(apiPath);
          } catch { /* ignore — SW may still have an older cached response */ }
        }
      }

      cachedCount++;

      const done = cachedCount + failedCount;
      setState({
        isCaching: true,
        totalPages: paths.length,
        cachedCount,
        failedCount,
        progress: done / paths.length,
      });
      toast.loading(
        t('pwa.cache_progress', { done, total: paths.length }),
        { id: toastId },
      );
    }

    setState({
      isCaching: false,
      totalPages: paths.length,
      cachedCount,
      failedCount,
      progress: 1,
    });

    if (failedCount === 0) {
      toast.success(t('pwa.cache_done', { count: cachedCount }), { id: toastId });
    } else {
      toast.warning(
        t('pwa.cache_partial', { cached: cachedCount, failed: failedCount }),
        { id: toastId },
      );
    }
  };

  return { cacheAllPages, ...state };
}
