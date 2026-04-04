'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ordratFetch } from '@/lib/api-client';
import { ShopContactInfo } from './endpoints';
import { ContactInfoSchema, ContactInfoResponse } from './schemas';

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateContactInfoInput {
  shopId: string;
  whatsAppNumber?: string | null;
  facebookLink?: string | null;
  xLink?: string | null;
  instagramLink?: string | null;
}

export interface UpdateContactInfoInput {
  whatsAppNumber?: string | null;
  facebookLink?: string | null;
  xLink?: string | null;
  instagramLink?: string | null;
}

// ─── Raw API functions ────────────────────────────────────────────────────────

export async function getContactInfoByShopId(
  shopId: string,
): Promise<ContactInfoResponse | null> {
  try {
    const data = await ordratFetch<unknown>(
      ShopContactInfo.GetByShopId(shopId),
    );
    if (!data) return null;
    const result = ContactInfoSchema.safeParse(data);
    return result.success ? result.data : null;
  } catch (err: unknown) {
    const msg = String((err as Error)?.message ?? '');
    // Any 4xx → no contact info yet, show create form
    if (/40[0-9]/.test(msg) || msg.toLowerCase().includes('not found')) {
      return null;
    }
    throw err;
  }
}

export async function createContactInfo(
  input: CreateContactInfoInput,
): Promise<void> {
  await ordratFetch<unknown>('/api/ShopContactInfo/Create', {
    method: 'POST',
    body: JSON.stringify(input),
    _entityType: 'ShopContactInfo',
  });
}

export async function updateContactInfo(
  id: string,
  input: UpdateContactInfoInput,
): Promise<void> {
  await ordratFetch<unknown>(`/api/ShopContactInfo/Update/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
    _entityType: 'ShopContactInfo',
    _entityId: id,
  });
}

export async function deleteContactInfo(id: string): Promise<void> {
  await ordratFetch<unknown>(`/api/ShopContactInfo/Delete/${id}`, {
    method: 'DELETE',
    _entityType: 'ShopContactInfo',
    _entityId: id,
  });
}

// ─── TanStack Query hooks ─────────────────────────────────────────────────────

export function useContactInfo() {
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useQuery({
    queryKey: ['contact-info', shopId],
    queryFn: () => getContactInfoByShopId(shopId),
    enabled: !!shopId,
    staleTime: 60_000,
    gcTime: 86_400_000,
  });
}

export function useCreateContactInfo() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useMutation<void, Error, Omit<CreateContactInfoInput, 'shopId'>>({
    mutationFn: (input) => createContactInfo({ ...input, shopId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-info', shopId] });
    },
  });
}

export function useUpdateContactInfo() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useMutation<void, Error, { id: string; input: UpdateContactInfoInput }>({
    mutationFn: ({ id, input }) => updateContactInfo(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-info', shopId] });
    },
  });
}

export function useDeleteContactInfo() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteContactInfo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-info', shopId] });
    },
  });
}
