'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ordratFetch } from '@/lib/api-client';
import { ShopResponseSchema, ShopResponse, CurrencySchema, CurrencyResponse, ThemeSchema, ThemeListSchema, ThemeResponse } from './schemas';
import { ENDPOINTS } from './endpoints';

// ─── Raw API functions ────────────────────────────────────────────────────────

export async function getShopById(shopId: string): Promise<ShopResponse> {
  const data = await ordratFetch<unknown>(ENDPOINTS.Shop.GetById(shopId));
  return ShopResponseSchema.parse(data);
}

/**
 * Update shop profile. Accepts multipart/form-data.
 * Logo and Background (cover) are binary fields in this same request.
 * NOTE: /api/Shop/UploadLogo and /api/Shop/UploadCover do NOT exist in the API.
 */
export async function updateShop(body: FormData): Promise<void> {
  await ordratFetch(ENDPOINTS.Shop.Update.path, {
    method: ENDPOINTS.Shop.Update.method,
    body,
  });
}

// ─── TanStack Query hooks ─────────────────────────────────────────────────────

export function useShopProfile() {
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => getShopById(shopId),
    enabled: !!shopId,
  });
}

/**
 * Returns "available" if the subdomain slug is free to claim, "taken" otherwise.
 * Pass only the slug — no .ordrat.com suffix. The suffix is appended internally.
 * The API expects the full domain (e.g. "galastore.ordrat.com") and responds with
 * plain text: "not exist" = available, anything else = taken/invalid.
 */
export async function checkSubdomain(slug: string): Promise<'available' | 'taken'> {
  const { getSession } = await import('next-auth/react');
  const session = await getSession();
  const token = session?.accessToken;

  const fullDomain = `${slug}.ordrat.com`;
  const params = new URLSearchParams({ subDomain: fullDomain });
  const base = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? '';
  const res = await fetch(`${base}${ENDPOINTS.Shop.CheckSubDomain.path}?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) return 'taken';
  const text = (await res.text()).trim().toLowerCase();
  return text === 'not exist' ? 'available' : 'taken';
}

export async function createShop(sellerId: string, currencyId: string, body: FormData): Promise<void> {
  await ordratFetch(ENDPOINTS.Shop.Create(sellerId, currencyId), {
    method: 'POST',
    body,
  });
}

export function useCreateShop() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const sellerId = session?.user?.id ?? '';

  return useMutation({
    mutationFn: ({ currencyId, body }: { currencyId: string; body: FormData }) =>
      createShop(sellerId, currencyId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop'] });
    },
  });
}

export async function getCurrencies(): Promise<CurrencyResponse[]> {
  const data = await ordratFetch<unknown[]>(ENDPOINTS.Currency.GetAll.path);
  return (data ?? []).map((c) => CurrencySchema.parse(c));
}

export function useCurrencies() {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: getCurrencies,
    staleTime: 10 * 60 * 1000, // currencies rarely change
  });
}

export async function getThemes(): Promise<ThemeResponse[]> {
  const data = await ordratFetch<unknown>(ENDPOINTS.Theme.GetAll.path);
  const parsed = ThemeListSchema.parse(data);
  return parsed.entities;
}

export function useThemes() {
  return useQuery({
    queryKey: ['themes'],
    queryFn: getThemes,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateShop() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useMutation({
    mutationFn: (body: FormData) => updateShop(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop', shopId] });
    },
  });
}
