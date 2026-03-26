'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ordratFetch } from '@/lib/api-client';
import { FullBranchSchema, FullBranchResponse } from './schemas';
import { z } from 'zod';

// ─── Branch input type ────────────────────────────────────────────────────────

export interface BranchInput {
  nameEn?: string;
  nameAr: string;           // required by backend
  zoneName: string;         // required by backend
  shopId: string;
  phoneNumber: string;
  addressText: string;      // required by backend
  openAt?: string;          // TimeSpan string e.g. "09:00:00"
  closedAt?: string;
  deliveryTime?: string;    // string type (not number)
  coverageRadius?: number;
  centerLatitude?: number;
  centerLongitude?: number;
  enableDeliveryOrders?: boolean;
  isFixedDelivery?: boolean;
  deliveryCharge?: number;
  deliveryPerKilo?: number; // min 1 if provided
  minimumDeliveryCharge?: number; // min 1 if provided
}

// ─── Raw API functions ────────────────────────────────────────────────────────

export async function getBranchesByShopId(
  shopId: string,
): Promise<FullBranchResponse[]> {
  const data = await ordratFetch<unknown>(
    `/api/Branch/GetByShopId/${shopId}`,
  );
  return z.array(FullBranchSchema).parse(data);
}

export async function getBranchById(
  id: string,
): Promise<FullBranchResponse> {
  const data = await ordratFetch<unknown>(`/api/Branch/GetById/${id}`);
  return FullBranchSchema.parse(data);
}

export async function searchBranches(
  searchParameter: string,
): Promise<FullBranchResponse[]> {
  const params = new URLSearchParams({ searchParameter });
  const data = await ordratFetch<unknown>(
    `/api/Branch/SearchByName?${params}`,
  );
  return z.array(FullBranchSchema).parse(data);
}

export async function createBranch(
  input: BranchInput,
): Promise<FullBranchResponse> {
  const data = await ordratFetch<unknown>('/api/Branch/Create', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return FullBranchSchema.parse(data);
}

export async function updateBranch(
  id: string,
  input: BranchInput,
): Promise<FullBranchResponse> {
  const data = await ordratFetch<unknown>(`/api/Branch/Update/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return FullBranchSchema.parse(data);
}

export async function deleteBranch(id: string): Promise<void> {
  await ordratFetch(`/api/Branch/Delete/${id}`, { method: 'DELETE' });
}

// ─── TanStack Query hooks ────────────────────────────────────────────────────

export function useBranches() {
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useQuery({
    queryKey: ['branches', shopId],
    queryFn: () => getBranchesByShopId(shopId),
    enabled: !!shopId,
  });
}

export function useSearchBranches(searchParameter: string) {
  return useQuery({
    queryKey: ['branches-search', searchParameter],
    queryFn: () => searchBranches(searchParameter),
    enabled: searchParameter.length > 0,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useMutation({
    mutationFn: (input: Omit<BranchInput, 'shopId'>) =>
      createBranch({ ...input, shopId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', shopId] });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Omit<BranchInput, 'shopId'>;
    }) => updateBranch(id, { ...input, shopId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', shopId] });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useMutation({
    mutationFn: (id: string) => deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', shopId] });
    },
  });
}
