'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, LoaderCircle } from 'lucide-react';

import { usePageMeta } from '@/hooks/use-page-meta';
import { useLogs, type LogsParams } from '@/lib/ordrat-api/logs';
import { LogsActionType, SourceChannel } from '@/lib/ordrat-api/schemas';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZES = [10, 25, 50] as const;
const ACTION_ENTRIES = Object.entries(LogsActionType) as [string, string][];

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

  const isArabic = i18n.language === 'ar';

  const params: LogsParams = {
    pageNumber,
    pageSize,
    startTime: startDate ? startDate.toISOString() : undefined,
    endTime: endDate ? endDate.toISOString() : undefined,
    action: action === '' ? undefined : action,
  };

  const { data: logs, isLoading, isError } = useLogs(params);

  // Client-side search filter on description/entity/shopName/branchName
  const filtered = search.trim()
    ? (logs ?? []).filter((l) => {
        const q = search.toLowerCase();
        return (
          (l.description ?? l.message ?? '').toLowerCase().includes(q) ||
          (l.entity ?? '').toLowerCase().includes(q) ||
          (l.shopName ?? '').toLowerCase().includes(q) ||
          (l.branchName ?? '').toLowerCase().includes(q)
        );
      })
    : (logs ?? []);

  function clearFilters() {
    setStartDate(null);
    setEndDate(null);
    setAction('');
    setSearch('');
    setPageNumber(1);
  }

  const hasFilters = !!(startDate || endDate || action !== '' || search);

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

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px]">
          <Input
            placeholder={t('logs.search')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPageNumber(1); }}
          />
        </div>
        <DatePicker
          value={startDate}
          onChange={(d) => { setStartDate(d); setPageNumber(1); }}
          placeholder={t('logs.startTime')}
          locale={isArabic ? 'ar' : 'en'}
          className="w-44"
        />
        <DatePicker
          value={endDate}
          onChange={(d) => { setEndDate(d); setPageNumber(1); }}
          placeholder={t('logs.endTime')}
          locale={isArabic ? 'ar' : 'en'}
          className="w-44"
        />
        <Select
          value={action === '' ? 'all' : String(action)}
          onValueChange={(v) => { setAction(v === 'all' ? '' : Number(v)); setPageNumber(1); }}
        >
          <SelectTrigger className="w-44">
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
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X className="w-3.5 h-3.5" />
            {t('logs.clearFilters')}
          </Button>
        )}
      </div>

      {/* Results table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-10 flex justify-center">
              <LoaderCircle className="size-6 animate-spin text-brand" />
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-destructive">{t('logs.loadError')}</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">{t('logs.emptyState')}</div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('logs.shopName')}</TableHead>
                  <TableHead>{t('logs.branchName')}</TableHead>
                  <TableHead className="whitespace-nowrap">{t('logs.timestamp')}</TableHead>
                  <TableHead>{t('logs.details')}</TableHead>
                  <TableHead>{t('logs.entity')}</TableHead>
                  <TableHead>{t('logs.source')}</TableHead>
                  <TableHead>{t('logs.actionType')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log, idx) => (
                  <TableRow key={log.id ?? idx}>
                    <TableCell className="text-sm">{log.shopName ?? '—'}</TableCell>
                    <TableCell className="text-sm">{log.branchName ?? '—'}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatTimestamp(log.timestamp ?? log.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {log.description ?? log.message ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">{log.entity ?? '—'}</TableCell>
                    <TableCell className="text-sm">
                      {log.source != null
                        ? (SourceChannel[log.source as keyof typeof SourceChannel] ?? String(log.source))
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getActionLabel(log.action ?? undefined)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label>{t('logs.pageSize')}</Label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => { setPageSize(Number(v)); setPageNumber(1); }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
          >
            ‹
          </Button>
          <span className="text-sm px-2">{pageNumber}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((p) => p + 1)}
            disabled={!logs || logs.length < pageSize}
          >
            ›
          </Button>
        </div>
      </div>
    </div>
  );
}
