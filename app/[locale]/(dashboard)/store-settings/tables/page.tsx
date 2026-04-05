'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, LoaderCircle } from 'lucide-react';

import { usePageMeta } from '@/hooks/use-page-meta';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useBranches } from '@/lib/ordrat-api/branch';
import { useTables, useCreateTable, useUpdateTable, useChangeTableStatus, useDeleteTable } from '@/lib/ordrat-api/table';
import { useUIStore } from '@/stores/ui-store';
import { TableResponse } from '@/lib/ordrat-api/schemas';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABLE_LOCATIONS = [0, 1, 2] as const;
const TABLE_STATUSES = [0, 1, 2] as const;

const STATUS_COLORS = {
  0: {
    chair: 'var(--color-zinc-200)',
    chairAccent: 'var(--color-zinc-400)',
    tabletop: 'var(--color-border)',
    stroke: 'var(--color-zinc-500)',
  },
  1: {
    chair: 'var(--color-zinc-200)',
    chairAccent: 'var(--color-zinc-400)',
    tabletop: 'var(--color-border)',
    stroke: 'var(--color-zinc-500)',
  },
  2: {
    chair: 'var(--color-zinc-200)',
    chairAccent: 'var(--color-zinc-400)',
    tabletop: 'var(--color-border)',
    stroke: 'var(--color-zinc-500)',
  },
} as const;

const STATUS_BADGE_VARIANTS: Record<number, 'success' | 'destructive' | 'warning'> = {
  0: 'success',
  1: 'destructive',
  2: 'warning',
};

const STATUS_LEGEND_CLASSES: Record<number, string> = {
  0: 'bg-emerald-500',
  1: 'bg-rose-500',
  2: 'bg-amber-400',
};

// ─── SVG Top-Down Table ───────────────────────────────────────────────────────

type ChairRect = { x: number; y: number; w: number; h: number; rx: number };

function ChairShape({
  chair,
  fill,
  accent,
  stroke,
}: {
  chair: ChairRect;
  fill: string;
  accent: string;
  stroke: string;
}) {
  const isHorizontal = chair.w > chair.h;
  const isTop = isHorizontal && chair.y < 30;
  const isLeft = !isHorizontal && chair.x < 30;
  const inset = {
    x: chair.x + 1.5,
    y: chair.y + 1.5,
    w: Math.max(chair.w - 3, 1),
    h: Math.max(chair.h - 3, 1),
    rx: Math.max(chair.rx - 0.75, 0.75),
  };

  const accentRect = isHorizontal
    ? {
        x: chair.x + 3,
        y: isTop ? chair.y : chair.y + chair.h - 5,
        w: chair.w - 6,
        h: 4,
      }
    : {
        x: isLeft ? chair.x : chair.x + chair.w - 5,
        y: chair.y + 3,
        w: 4,
        h: chair.h - 6,
      };

  return (
    <g>
      <rect
        x={chair.x}
        y={chair.y}
        width={chair.w}
        height={chair.h}
        rx={chair.rx}
        fill={fill}
        stroke={stroke}
        strokeWidth="1.25"
      />
      <rect
        x={inset.x}
        y={inset.y}
        width={inset.w}
        height={inset.h}
        rx={inset.rx}
        fill="none"
        stroke={accent}
        strokeOpacity="0.4"
        strokeWidth="0.75"
      />
      <rect
        x={accentRect.x}
        y={accentRect.y}
        width={accentRect.w}
        height={accentRect.h}
        rx="1"
        fill={accent}
      />
    </g>
  );
}

function getChairs(capacity: number): ChairRect[] {
  const capped = Math.min(capacity, 8);
  if (capped <= 4) {
    const all: ChairRect[] = [
      { x: 48, y: 5,  w: 24, h: 16, rx: 2 },
      { x: 48, y: 99, w: 24, h: 16, rx: 2 },
      { x: 5,  y: 48, w: 16, h: 24, rx: 2 },
      { x: 99, y: 48, w: 16, h: 24, rx: 2 },
    ];
    return all.slice(0, capped);
  }

  if (capped === 5) {
    return [
      { x: 30, y: 5,  w: 24, h: 16, rx: 2 },
      { x: 66, y: 5,  w: 24, h: 16, rx: 2 },
      { x: 48, y: 99, w: 24, h: 16, rx: 2 },
      { x: 5,  y: 48, w: 16, h: 24, rx: 2 },
      { x: 99, y: 48, w: 16, h: 24, rx: 2 },
    ];
  }

  if (capped === 6) {
    return [
      { x: 30, y: 5,  w: 24, h: 16, rx: 2 },
      { x: 66, y: 5,  w: 24, h: 16, rx: 2 },
      { x: 30, y: 99, w: 24, h: 16, rx: 2 },
      { x: 66, y: 99, w: 24, h: 16, rx: 2 },
      { x: 5,  y: 48, w: 16, h: 24, rx: 2 },
      { x: 99, y: 48, w: 16, h: 24, rx: 2 },
    ];
  }

  const all: ChairRect[] = [
    { x: 30, y: 5,  w: 24, h: 16, rx: 2 },
    { x: 66, y: 5,  w: 24, h: 16, rx: 2 },
    { x: 30, y: 99, w: 24, h: 16, rx: 2 },
    { x: 66, y: 99, w: 24, h: 16, rx: 2 },
    { x: 5,  y: 30, w: 16, h: 24, rx: 2 },
    { x: 5,  y: 66, w: 16, h: 24, rx: 2 },
    { x: 99, y: 30, w: 16, h: 24, rx: 2 },
    { x: 99, y: 66, w: 16, h: 24, rx: 2 },
  ];
  return all.slice(0, capped);
}

function TableTopDown({
  tableNumber,
  capacity,
  status,
}: {
  tableNumber: number;
  capacity: number;
  status: number;
}) {
  const colors = STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS[0];
  const chairs = getChairs(capacity);
  const isRound = capacity <= 4;

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-40 w-40"
    >
      {chairs.map((chair, index) => (
        <ChairShape
          key={index}
          chair={chair}
          fill={colors.chair}
          accent={colors.chairAccent}
          stroke={colors.stroke}
        />
      ))}
      {isRound ? (
        <circle
          cx="60" cy="60" r="30"
          fill={colors.tabletop}
          stroke={colors.stroke}
          strokeWidth="2.5"
        />
      ) : (
        <rect
          x="26" y="26" width="68" height="68" rx="12"
          fill={colors.tabletop}
          stroke={colors.stroke}
          strokeWidth="2.5"
        />
      )}
      <text
        x="60" y="65"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontSize="20"
        fontWeight="600"
        fill="#3f3f46"
      >
        {tableNumber}
      </text>
    </svg>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function TableStatusBadge({
  status,
  label,
}: {
  status: (typeof TABLE_STATUSES)[number];
  label: string;
}) {
  return (
    <Badge
      variant={STATUS_BADGE_VARIANTS[status]}
      appearance="light"
      size="sm"
      className="h-5 gap-1 px-1.5 font-medium"
    >
      {label}
    </Badge>
  );
}

// ─── Restaurant Table Card ────────────────────────────────────────────────────

function RestaurantTableCard({
  table,
  onEdit,
  onDelete,
  onStatusChange,
  isStatusChanging,
}: {
  table: TableResponse;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  isStatusChanging: boolean;
}) {
  const { t } = useTranslation('common');

  const locationLabel = t(`tables.location${table.location}` as never);
  const statusLabel = t(`tables.status${table.tableStatus}` as never);

  return (
    <div className="group relative overflow-hidden rounded-[30px] border border-border/70 bg-transparent p-5 transition-all duration-300">
      <div className="absolute top-5 inset-e-5 flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          mode="icon"
          onClick={onEdit}
          aria-label={t('actions.edit')}
          className="size-8 rounded-full border border-border/70 bg-background/80 backdrop-blur hover:bg-zinc-200 dark:hover:bg-zinc-700"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          mode="icon"
          onClick={onDelete}
          aria-label={t('actions.delete')}
          className="size-8 rounded-full border border-border/70 bg-background/80 text-destructive backdrop-blur hover:bg-red-100 hover:text-destructive dark:hover:bg-red-950"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="relative flex items-start justify-between gap-3 pe-20">
        <div>
          <Select
            value={String(table.tableStatus)}
            onValueChange={onStatusChange}
            disabled={isStatusChanging}
          >
            <SelectTrigger className="h-auto w-auto gap-1 border-0 bg-transparent p-0 shadow-none ring-0 hover:bg-transparent focus:ring-0">
              <SelectValue>
                <TableStatusBadge
                  status={table.tableStatus as (typeof TABLE_STATUSES)[number]}
                  label={statusLabel}
                />
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TABLE_STATUSES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  <TableStatusBadge status={s} label={t(`tables.status${s}` as never)} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center [&_svg]:max-w-full [&_svg]:h-auto">
        <TableTopDown
          tableNumber={table.tableNumber}
          capacity={table.capacity}
          status={table.tableStatus}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border/70 bg-background/60 px-2 py-1.5">
          <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{t('tables.capacity')}</p>
          <p className="mt-0.5 text-[0.8125rem] font-semibold text-foreground">{table.capacity} {t('tables.seats')}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-background/60 px-2 py-1.5">
          <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{t('tables.location')}</p>
          <p className="mt-0.5 text-[0.8125rem] font-semibold text-foreground">{locationLabel}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Form schema ──────────────────────────────────────────────────────────────

const tableFormSchema = z.object({
  tableNumber: z.number().min(1),
  capacity: z.number().min(1),
  location: z.string().min(1),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
});

type TableFormValues = z.infer<typeof tableFormSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TablesPage() {
  const { t } = useTranslation('common');
  usePageMeta(t('tables.title'));

  const { isOffline } = useOnlineStatus();
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const activeBranchId = selectedBranchId || branches?.[0]?.id || '';

  const { data: tables, isLoading: tablesLoading, isError } = useTables(activeBranchId);
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const changeStatus = useChangeTableStatus();
  const deleteTableMut = useDeleteTable();
  const { confirm } = useUIStore();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TableResponse | null>(null);

  const addForm = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: { tableNumber: 1, capacity: 2, location: '0', descriptionEn: '', descriptionAr: '' },
  });

  const editForm = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: { tableNumber: 1, capacity: 2, location: '0', descriptionEn: '', descriptionAr: '' },
  });

  useEffect(() => {
    if (branchesLoading) return;
    if (!branches?.length) {
      if (selectedBranchId) setSelectedBranchId('');
      return;
    }
    const hasSelectedBranch = branches.some((branch) => branch.id === selectedBranchId);
    if (!hasSelectedBranch) setSelectedBranchId(branches[0].id);
  }, [branches, branchesLoading, selectedBranchId]);

  function openEdit(table: TableResponse) {
    setEditTarget(table);
    editForm.reset({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      location: String(table.location),
      descriptionEn: table.descriptionEn ?? '',
      descriptionAr: table.descriptionAr ?? '',
    });
  }

  async function onAdd(values: TableFormValues) {
    try {
      await createTable.mutateAsync({
        branchId: activeBranchId,
        input: {
          tableNumber: values.tableNumber,
          tableStatus: 0,
          capacity: values.capacity,
          location: Number(values.location),
          branchId: activeBranchId,
          descriptionEn: values.descriptionEn || null,
          descriptionAr: values.descriptionAr || null,
        },
      });
      setAddOpen(false);
      addForm.reset();
      if (!isOffline) toast.success(t('tables.createSuccess'));
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? '';
      if (msg.toLowerCase().includes('duplicate') || msg.includes('409')) {
        toast.error(t('tables.duplicate'));
      } else {
        toast.error(t('tables.createError'));
      }
    }
  }

  async function onEdit(values: TableFormValues) {
    if (!editTarget) return;
    try {
      await updateTable.mutateAsync({
        id: editTarget.id,
        branchId: activeBranchId,
        input: {
          tableNumber: values.tableNumber,
          capacity: values.capacity,
          location: Number(values.location),
          descriptionEn: values.descriptionEn || null,
          descriptionAr: values.descriptionAr || null,
        },
      });
      setEditTarget(null);
      if (!isOffline) toast.success(t('tables.updateSuccess'));
    } catch {
      toast.error(t('tables.updateError'));
    }
  }

  async function onStatusChange(table: TableResponse, status: string) {
    try {
      await changeStatus.mutateAsync({
        id: table.id,
        branchId: activeBranchId,
        status: Number(status),
      });
      if (!isOffline) toast.success(t('tables.changeStatusSuccess'));
    } catch {
      toast.error(t('tables.changeStatusError'));
    }
  }

  function handleDeleteTable(table: TableResponse) {
    confirm({
      title: t('actions.delete'),
      description: t('tables.deleteConfirm'),
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await deleteTableMut.mutateAsync({ id: table.id, branchId: activeBranchId });
          if (!isOffline) toast.success(t('tables.deleteSuccess'));
        } catch {
          toast.error(t('tables.deleteError'));
        }
      },
    });
  }

  const filteredTables = (tables ?? []).filter((table) => {
    const matchesStatus = statusFilter === 'all' || String(table.tableStatus) === statusFilter;
    const matchesLocation = locationFilter === 'all' || String(table.location) === locationFilter;

    return matchesStatus && matchesLocation;
  });

  return (
    <div className="min-w-0 space-y-6 py-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-start justify-between gap-3 xl:flex-nowrap">
        <div className="grid min-w-0 flex-1 gap-2.5 lg:grid-cols-2 xl:grid-cols-[fit-content(12rem)_fit-content(8rem)_fit-content(9rem)_fit-content(7rem)] xl:items-center">
          <div className="w-full sm:w-fit">
            <Select
              value={activeBranchId}
              onValueChange={setSelectedBranchId}
              disabled={branchesLoading}
            >
              <SelectTrigger className="h-8 w-full sm:w-fit sm:min-w-32 sm:max-w-44 px-2.5 text-xs">
                <SelectValue placeholder={t('tables.selectBranch')} />
              </SelectTrigger>
              <SelectContent>
                {branches?.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name || branch.nameEn || branch.nameAr || branch.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-full sm:w-fit sm:min-w-0 px-2.5 text-xs">
              <SelectValue placeholder={t('tables.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('tables.status')}</SelectItem>
              {TABLE_STATUSES.map((status) => (
                <SelectItem key={status} value={String(status)}>
                  {t(`tables.status${status}` as never)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="h-8 w-full sm:w-fit sm:min-w-0 px-2.5 text-xs">
              <SelectValue placeholder={t('tables.filterLocation')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('tables.locations')}</SelectItem>
              {TABLE_LOCATIONS.map((location) => (
                <SelectItem key={location} value={String(location)}>
                  {t(`tables.location${location}` as never)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

        </div>

        <div className="flex shrink-0 items-center gap-2 self-start">
          

          <div className="flex w-fit items-center gap-1.5 rounded-full border border-border/70 bg-card px-2 py-1.5 dark:bg-card">
            {TABLE_STATUSES.map((status) => (
              <Tooltip key={status}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={t(`tables.status${status}` as never)}
                    className="size-3 rounded-full ring-1 ring-background transition-transform hover:scale-110 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span className={[ 'block size-full rounded-full', STATUS_LEGEND_CLASSES[status] ].join(' ')} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t(`tables.status${status}` as never)}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            disabled={!activeBranchId}
            className="h-8 bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="w-4 h-4" />
            {t('tables.add')}
          </Button>
        </div>
      </div>

      {/* Content area */}
      {!activeBranchId ? (
        <div className="p-10 text-center text-muted-foreground">
          {branchesLoading ? (
            <div className="flex justify-center">
              <LoaderCircle className="size-6 animate-spin text-brand" />
            </div>
          ) : (
            t('tables.selectBranchPrompt')
          )}
        </div>
      ) : tablesLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-104 rounded-[30px]" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 text-center text-destructive">{t('tables.loadError')}</div>
      ) : !tables || tables.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground">{t('tables.emptyState')}</div>
      ) : filteredTables.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground">{t('tables.emptyFilteredState')}</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTables.map((table) => (
            <RestaurantTableCard
              key={table.id}
              table={table}
              onEdit={() => openEdit(table)}
              onDelete={() => handleDeleteTable(table)}
              onStatusChange={(status) => onStatusChange(table, status)}
              isStatusChanging={changeStatus.isPending}
            />
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('tables.add')}</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-4">
              <TableFormFields form={addForm} t={t} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                  {t('actions.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="min-w-28 bg-brand text-brand-foreground hover:bg-brand/90"
                  disabled={createTable.isPending}
                >
                  {createTable.isPending && <LoaderCircle className="size-4 animate-spin" />}
                  {createTable.isPending ? t('actions.saving') : t('actions.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('tables.edit')}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
              <TableFormFields form={editForm} t={t} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                  {t('actions.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="min-w-28 bg-brand text-brand-foreground hover:bg-brand/90"
                  disabled={updateTable.isPending}
                >
                  {updateTable.isPending && <LoaderCircle className="size-4 animate-spin" />}
                  {updateTable.isPending ? t('actions.saving') : t('actions.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Shared form fields ───────────────────────────────────────────────────────

function TableFormFields({
  form,
  t,
}: {
  form: UseFormReturn<TableFormValues>;
  t: (key: string) => string;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="tableNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('tables.tableNumber')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('tables.capacity')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('tables.location')}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={t('tables.selectLocation')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {TABLE_LOCATIONS.map((l) => (
                  <SelectItem key={l} value={String(l)}>
                    {t(`tables.location${l}` as never)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="descriptionEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('tables.descriptionEn')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="descriptionAr"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('tables.descriptionAr')}</FormLabel>
              <FormControl>
                <Input {...field} dir="rtl" />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
