'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordratFetch } from '@/lib/api-client';
import { TableSchema, TableResponse } from './schemas';
import { z } from 'zod';

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateTableInput {
  tableNumber: number;
  tableStatus: number;
  capacity: number;
  location: number;
  branchId: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
}

export interface UpdateTableInput {
  tableNumber: number;
  capacity: number;
  location: number;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
}

// ─── Raw API functions ────────────────────────────────────────────────────────

export async function getTablesByBranch(
  branchId: string,
): Promise<TableResponse[]> {
  const data = await ordratFetch<unknown>(
    `/api/Table/GetAllShopTables/${branchId}`,
  );
  return z.array(TableSchema).parse(data);
}

export async function createTable(
  branchId: string,
  input: CreateTableInput,
): Promise<void> {
  await ordratFetch<unknown>(`/api/Table/CreateTable/${branchId}`, {
    method: 'POST',
    body: JSON.stringify(input),
    _entityType: 'Table',
  });
}

export async function updateTable(
  id: string,
  input: UpdateTableInput,
): Promise<void> {
  await ordratFetch<unknown>(`/api/Table/UpdateTable/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
    _entityType: 'Table',
    _entityId: id,
  });
}

export async function changeTableStatus(
  id: string,
  status: number,
): Promise<void> {
  await ordratFetch<unknown>(`/api/Table/ChangeTableStatus/ChangeTableStatus/${id}`, {
    method: 'PUT',
    body: JSON.stringify(status),
    _entityType: 'Table',
    _entityId: id,
  });
}

export async function deleteTable(id: string): Promise<void> {
  await ordratFetch<unknown>(`/api/Table/DeleteTable/${id}`, {
    method: 'DELETE',
    _entityType: 'Table',
    _entityId: id,
  });
}

// ─── TanStack Query hooks ─────────────────────────────────────────────────────

export function useTables(branchId: string) {
  return useQuery({
    queryKey: ['tables', branchId],
    queryFn: () => getTablesByBranch(branchId),
    enabled: !!branchId,
    staleTime: 60_000,
    gcTime: 86_400_000,
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { branchId: string; input: CreateTableInput }>({
    mutationFn: ({ branchId, input }) => createTable(branchId, input),
    onSuccess: (_, { branchId }) => {
      queryClient.invalidateQueries({ queryKey: ['tables', branchId] });
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; branchId: string; input: UpdateTableInput }>({
    mutationFn: ({ id, input }) => updateTable(id, input),
    onSuccess: (_, { branchId }) => {
      queryClient.invalidateQueries({ queryKey: ['tables', branchId] });
    },
  });
}

export function useChangeTableStatus() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; branchId: string; status: number }>({
    mutationFn: ({ id, status }) => changeTableStatus(id, status),
    onSuccess: (_, { branchId }) => {
      queryClient.invalidateQueries({ queryKey: ['tables', branchId] });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; branchId: string }>({
    mutationFn: ({ id }) => deleteTable(id),
    onSuccess: (_, { branchId }) => {
      queryClient.invalidateQueries({ queryKey: ['tables', branchId] });
    },
  });
}
