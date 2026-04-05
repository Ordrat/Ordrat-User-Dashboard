'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Columns3 } from 'lucide-react';
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';

import { usePageMeta } from '@/hooks/use-page-meta';
import { useLogs, type LogsParams } from '@/lib/ordrat-api/logs';
import { LogsActionType, SourceChannel, type LogEntryResponse } from '@/lib/ordrat-api/schemas';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataGrid, DataGridContainer } from '@/components/ui/data-grid';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';

const PAGE_SIZES = [10, 25, 50] as const;
const ACTION_ENTRIES = Object.entries(LogsActionType) as [string, string][];

const columnHelper = createColumnHelper<LogEntryResponse>();

function formatTimestamp(raw: string | null | undefined): string {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleString();
  } catch {
    return raw;
  }
}

function getActionLabel(actionNum: number | null | undefined): string {
  if (actionNum == null) return '—';
  return LogsActionType[actionNum as keyof typeof LogsActionType] ?? String(actionNum);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LogsPage() {
  const { t, i18n } = useTranslation('common');
  usePageMeta(t('logs.title'));

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [action, setAction] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const isArabic = i18n.language === 'ar';

  const params: LogsParams = {
    pageNumber,
    pageSize,
    startTime: startDate ? startDate.toISOString() : undefined,
    endTime: endDate ? endDate.toISOString() : undefined,
    action: action === '' ? undefined : action,
  };

  const { data: logs, isLoading, isError } = useLogs(params);

  const filtered = useMemo(() => {
    if (!search.trim()) return logs ?? [];
    const q = search.toLowerCase();
    return (logs ?? []).filter((l) =>
      (l.description ?? l.message ?? '').toLowerCase().includes(q) ||
      (l.entity ?? '').toLowerCase().includes(q) ||
      (l.shopName ?? '').toLowerCase().includes(q) ||
      (l.branchName ?? '').toLowerCase().includes(q),
    );
  }, [logs, search]);

  function clearFilters() {
    setStartDate(null);
    setEndDate(null);
    setAction('');
    setSearch('');
    setPageNumber(1);
  }

  const hasFilters = !!(startDate || endDate || action !== '' || search);

  const hasMore = (logs?.length ?? 0) >= pageSize;
  const estimatedPageCount = hasMore ? pageNumber + 1 : pageNumber;
  const estimatedTotal = (pageNumber - 1) * pageSize + filtered.length;

  const columns = useMemo(
    () => [
      columnHelper.accessor('shopName', {
        header: t('logs.shopName'),
        cell: ({ getValue }) => getValue() ?? '—',
        enableSorting: false,
        meta: { headerTitle: t('logs.shopName'), skeleton: <Skeleton className="h-3.5 w-24" /> },
      }),
      columnHelper.accessor('branchName', {
        header: t('logs.branchName'),
        cell: ({ getValue }) => getValue() ?? '—',
        enableSorting: false,
        meta: { headerTitle: t('logs.branchName'), skeleton: <Skeleton className="h-3.5 w-24" /> },
      }),
      columnHelper.accessor((row) => row.timestamp ?? row.createdAt, {
        id: 'timestamp',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t('logs.timestamp')} />
        ),
        cell: ({ getValue }) => (
          <span className="whitespace-nowrap tabular-nums">{formatTimestamp(getValue())}</span>
        ),
        enableSorting: true,
        sortingFn: (a, b) => {
          const aVal = a.original.timestamp ?? a.original.createdAt ?? '';
          const bVal = b.original.timestamp ?? b.original.createdAt ?? '';
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        },
        meta: { headerTitle: t('logs.timestamp'), skeleton: <Skeleton className="h-3.5 w-32" /> },
      }),
      columnHelper.accessor((row) => row.description ?? row.message, {
        id: 'details',
        header: t('logs.details'),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground max-w-xs truncate block">{getValue() ?? '—'}</span>
        ),
        enableSorting: false,
        meta: { headerTitle: t('logs.details'), skeleton: <Skeleton className="h-3.5 w-48" /> },
      }),
      columnHelper.accessor('entity', {
        header: t('logs.entity'),
        cell: ({ getValue }) => getValue() ?? '—',
        enableSorting: false,
        meta: { headerTitle: t('logs.entity'), skeleton: <Skeleton className="h-3.5 w-20" /> },
      }),
      columnHelper.accessor('source', {
        header: t('logs.source'),
        cell: ({ getValue }) => {
          const src = getValue();
          return src != null
            ? (SourceChannel[src as keyof typeof SourceChannel] ?? String(src))
            : '—';
        },
        enableSorting: false,
        meta: { headerTitle: t('logs.source'), skeleton: <Skeleton className="h-3.5 w-16" /> },
      }),
      columnHelper.accessor('action', {
        header: t('logs.actionType'),
        cell: ({ getValue }) => (
          <Badge variant="secondary" size="sm">{getActionLabel(getValue() ?? undefined)}</Badge>
        ),
        enableSorting: false,
        meta: { headerTitle: t('logs.actionType'), skeleton: <Skeleton className="h-4 w-20 rounded-full" /> },
      }),
    ],
    [t],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: {
      sorting,
      columnVisibility,
      pagination: { pageIndex: pageNumber - 1, pageSize },
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex: pageNumber - 1, pageSize })
          : updater;
      setPageNumber(next.pageIndex + 1);
      setPageSize(next.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: estimatedPageCount,
  });

  return (
    <div className="min-w-0 space-y-4 py-6">
      {/* Filters + column visibility */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="h-9 w-40"
          placeholder={t('logs.search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPageNumber(1); }}
        />
        <DataGridColumnVisibility
          table={table}
          trigger={
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <Columns3 className="size-4" />
              {t('logs.columns')}
            </Button>
          }
        />
        <DatePicker
          value={startDate}
          onChange={(d) => { setStartDate(d); setPageNumber(1); }}
          placeholder={t('logs.startTime')}
          locale={isArabic ? 'ar' : 'en'}
          className="h-9 w-40"
        />
        <DatePicker
          value={endDate}
          onChange={(d) => { setEndDate(d); setPageNumber(1); }}
          placeholder={t('logs.endTime')}
          locale={isArabic ? 'ar' : 'en'}
          className="h-9 w-40"
        />
        <Select
          value={action === '' ? 'all' : String(action)}
          onValueChange={(v) => { setAction(v === 'all' ? '' : Number(v)); setPageNumber(1); }}
        >
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder={t('logs.allActions')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('logs.allActions')}</SelectItem>
            {ACTION_ENTRIES.map(([num, label]) => (
              <SelectItem key={num} value={num}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1 text-muted-foreground">
            <X className="w-3.5 h-3.5" />
            {t('logs.clearFilters')}
          </Button>
        )}
      </div>

      {/* DataGrid */}
      <DataGrid
        table={table}
        recordCount={estimatedTotal}
        isLoading={isLoading}
        loadingMode="skeleton"
        emptyMessage={isError ? t('logs.loadError') : t('logs.emptyState')}
        tableLayout={{ dense: true, stripped: true, rowBorder: false, width: 'auto' }}
      >
        <DataGridContainer>
          <DataGridTable />
        </DataGridContainer>
        <DataGridPagination
          sizes={[...PAGE_SIZES]}
          className="px-4 py-3 border-t border-border"
        />
      </DataGrid>
    </div>
  );
}
