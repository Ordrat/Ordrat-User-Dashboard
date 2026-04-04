'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ordratFetch } from '@/lib/api-client';
import { PaymentGatewaySchema, PaymentGatewayResponse } from './schemas';
import { z } from 'zod';

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreatePaymentGatewayInput {
  shopId: string;
  paymentGatewayId?: string;
  isEnabled: boolean;
  priority: number;
  paymentMethod: number;
  gatewayNameAr?: string | null;
  gatewayNameEn?: string | null;
  gatewayDescriptionAr?: string | null;
  gatewayDescriptionEn?: string | null;
}

export interface UpdatePaymentGatewayInput {
  isEnabled: boolean;
  priority: number;
  paymentMethod: number;
  gatewayNameAr?: string | null;
  gatewayNameEn?: string | null;
  gatewayDescriptionAr?: string | null;
  gatewayDescriptionEn?: string | null;
}

// ─── Raw API functions ────────────────────────────────────────────────────────

export async function getPaymentGatewaysByShopId(
  shopId: string,
): Promise<PaymentGatewayResponse[]> {
  const data = await ordratFetch<unknown>(
    `/api/ShopPaymentGateway/GetByShopId/${shopId}`,
  );
  return z.array(PaymentGatewaySchema).parse(data);
}

export async function createPaymentGateway(
  input: CreatePaymentGatewayInput,
): Promise<void> {
  await ordratFetch<unknown>('/api/ShopPaymentGateway/Create', {
    method: 'POST',
    body: JSON.stringify(input),
    _entityType: 'ShopPaymentGateway',
  });
}

export async function updatePaymentGateway(
  id: string,
  input: UpdatePaymentGatewayInput,
): Promise<void> {
  await ordratFetch<unknown>(`/api/ShopPaymentGateway/Update/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
    _entityType: 'ShopPaymentGateway',
    _entityId: id,
  });
}

// ─── TanStack Query hooks ─────────────────────────────────────────────────────

export function usePaymentGateways() {
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useQuery({
    queryKey: ['payment-gateways', shopId],
    queryFn: () => getPaymentGatewaysByShopId(shopId),
    enabled: !!shopId,
    staleTime: 60_000,
    gcTime: 86_400_000,
  });
}

export function useCreatePaymentGateway() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useMutation<void, Error, Omit<CreatePaymentGatewayInput, 'shopId'>>({
    mutationFn: (input) => createPaymentGateway({ ...input, shopId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways', shopId] });
    },
  });
}

export function useUpdatePaymentGateway() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useMutation<void, Error, { id: string; input: UpdatePaymentGatewayInput }>({
    mutationFn: ({ id, input }) => updatePaymentGateway(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateways', shopId] });
    },
  });
}
