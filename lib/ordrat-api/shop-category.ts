'use client';

import { useQuery } from '@tanstack/react-query';
import { ordratFetch } from '@/lib/api-client';
import { ShopCategorySchema, ShopCategoryResponse } from './schemas';
import { z } from 'zod';

// ─── Raw API functions ────────────────────────────────────────────────────────

export async function getAllShopCategories(): Promise<ShopCategoryResponse[]> {
  const data = await ordratFetch<unknown>('/api/ShopCategory/GetAll');
  return z.array(ShopCategorySchema).parse(data);
}

// ─── TanStack Query hooks ────────────────────────────────────────────────────

export function useShopCategories() {
  return useQuery({
    queryKey: ['shop-categories'],
    queryFn: getAllShopCategories,
    staleTime: 5 * 60 * 1000, // categories change rarely
  });
}
