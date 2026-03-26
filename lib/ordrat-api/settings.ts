'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ordratFetch } from '@/lib/api-client';
import {
  ShopSettingsResponseSchema,
  ShopSettingsResponse,
  WorkingHoursSchema,
  WorkingHoursResponse,
} from './schemas';
import { z } from 'zod';

// ─── Settings input type ──────────────────────────────────────────────────────

export interface ShopSettingsInput {
  transactionType: number;
  deliveryFeeValue: number;
  shippingPricingMethod: number;
  fixedShippingPrice?: number;
  cityPrices?: { city: string; price: number }[];
}

// ─── WorkingHours input type ──────────────────────────────────────────────────

export interface WorkingHoursInput {
  shopId: string;
  dayOfWeek: number;
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
}

// ─── Raw API functions — Settings ─────────────────────────────────────────────

export async function getSettingsByShopId(
  shopId: string,
): Promise<ShopSettingsResponse> {
  const data = await ordratFetch<unknown>(
    `/api/Settings/GetByShopId/${shopId}`,
  );
  return ShopSettingsResponseSchema.parse(data);
}

export async function updateSettings(
  shopId: string,
  input: ShopSettingsInput,
): Promise<ShopSettingsResponse> {
  const data = await ordratFetch<unknown>(
    `/api/Settings/Update/${shopId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
  return ShopSettingsResponseSchema.parse(data);
}

// ─── Raw API functions — WorkingHours ─────────────────────────────────────────

export async function getWorkingHoursByShopId(
  shopId: string,
): Promise<WorkingHoursResponse[]> {
  const data = await ordratFetch<unknown>(
    `/api/WorkingHours/GetByShopId/${shopId}`,
  );
  return z.array(WorkingHoursSchema).parse(data);
}

export async function createWorkingHours(
  input: WorkingHoursInput,
): Promise<WorkingHoursResponse> {
  const data = await ordratFetch<unknown>('/api/WorkingHours/Create', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return WorkingHoursSchema.parse(data);
}

export async function updateWorkingHours(
  id: string,
  input: Omit<WorkingHoursInput, 'shopId'>,
): Promise<WorkingHoursResponse> {
  const data = await ordratFetch<unknown>(
    `/api/WorkingHours/Update/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
  return WorkingHoursSchema.parse(data);
}

// ─── TanStack Query hooks — Settings ─────────────────────────────────────────

export function useShopSettings() {
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useQuery({
    queryKey: ['shop-settings', shopId],
    queryFn: () => getSettingsByShopId(shopId),
    enabled: !!shopId,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useMutation({
    mutationFn: (input: ShopSettingsInput) => updateSettings(shopId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-settings', shopId] });
    },
  });
}

// ─── TanStack Query hooks — WorkingHours ─────────────────────────────────────

export function useWorkingHours() {
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useQuery({
    queryKey: ['working-hours', shopId],
    queryFn: () => getWorkingHoursByShopId(shopId),
    enabled: !!shopId,
  });
}

export function useCreateWorkingHours() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useMutation({
    mutationFn: (input: WorkingHoursInput) => createWorkingHours(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['working-hours', shopId] });
    },
  });
}

export function useUpdateWorkingHours() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Omit<WorkingHoursInput, 'shopId'>;
    }) => updateWorkingHours(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['working-hours', shopId] });
    },
  });
}
