'use client';

import { useQuery } from '@tanstack/react-query';
import { ordratFetch } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/ordrat-api/endpoints';
import { LogEntrySchema, LogEntryResponse } from './schemas';
import { z } from 'zod';

// ─── Params type ──────────────────────────────────────────────────────────────

export interface LogsParams {
  pageNumber?: number;
  pageSize?: number;
  startTime?: string;
  endTime?: string;
  action?: number | '';
  entity?: string;
  entityId?: string;
}

// ─── Raw API function ─────────────────────────────────────────────────────────

export async function getLogsOverTime(
  params: LogsParams,
): Promise<LogEntryResponse[]> {
  const searchParams = new URLSearchParams();
  if (params.pageNumber != null)
    searchParams.set('PageNumber', String(params.pageNumber));
  if (params.pageSize != null)
    searchParams.set('PageSize', String(params.pageSize));
  if (params.startTime) searchParams.set('StartTime', params.startTime);
  if (params.endTime) searchParams.set('EndTime', params.endTime);
  if (params.action !== '' && params.action != null)
    searchParams.set('Action', String(params.action));
  if (params.entity) searchParams.set('Entity', params.entity);
  if (params.entityId) searchParams.set('EntityId', params.entityId);

  const query = searchParams.toString();
  const url = `${ENDPOINTS.Logs.GetLogsOverTime.path}${query ? `?${query}` : ''}`;
  const data = await ordratFetch<unknown>(url);

  // The API returns a paginated wrapper { entities: [], nextPage, totalPages }
  const raw = Array.isArray(data) ? data : (data as { entities?: unknown[] })?.entities ?? [];
  return z.array(LogEntrySchema).parse(raw);
}

// ─── TanStack Query hook ──────────────────────────────────────────────────────

export function useLogs(params: LogsParams) {
  return useQuery({
    queryKey: ['logs', params],
    queryFn: () => getLogsOverTime(params),
    staleTime: 30_000,
    gcTime: 86_400_000,
  });
}
