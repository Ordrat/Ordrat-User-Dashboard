'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';

import {
  LoaderCircle,
  Plus,
  Pencil,
  Trash2,
  GitBranch,
  TriangleAlert,
  Search,
  Target,
  Columns3,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input, InputAddon, InputGroup } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimePicker } from '@/components/ui/time-picker';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DataGrid, DataGridContainer } from '@/components/ui/data-grid';
import { DataGridTable, DataGridTableRowSelect, DataGridTableRowSelectAll } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { useUIStore } from '@/stores/ui-store';

import { usePageMeta } from '@/hooks/use-page-meta';
import { useOnlineStatus } from '@/hooks/use-online-status';
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
  type BranchInput,
} from '@/lib/ordrat-api/branch';
import { useShopProfile } from '@/lib/ordrat-api/shop';
import { ShopLanguage, type FullBranchResponse } from '@/lib/ordrat-api/schemas';

// ─── Dynamic import: Leaflet map (SSR disabled) ───────────────────────────────

const LocationPicker = dynamic(
  () => import('@/components/branches/location-picker').then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => <div className="h-52 bg-muted rounded-lg animate-pulse" />,
  },
);

// ─── Branch form schema ───────────────────────────────────────────────────────

const branchFormSchema = z.object({
  nameEn: z.string().optional(),
  nameAr: z.string().optional(),
  zoneName: z.string().min(1, 'Required'),
  phone: z.string().min(1, 'Required'),
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  coverageRadius: z.string().optional(),
  is24Hours: z.boolean().optional(),
  openAt: z.string().optional(),
  closedAt: z.string().optional(),
  deliveryTime: z.string().optional(),
  enableDeliveryOrders: z.boolean().optional(),
  isFixedDelivery: z.boolean().optional(),
  deliveryCharge: z.string().optional(),
});

type BranchFormValues = z.infer<typeof branchFormSchema>;

// ─── Column helper ────────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<FullBranchResponse>();

// ─── Branch Form Dialog ───────────────────────────────────────────────────────

function BranchFormDialog({
  open,
  onOpenChange,
  branch,
  shopLanguage,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: FullBranchResponse;
  shopLanguage: number;
  onSave: (values: BranchFormValues) => Promise<boolean>;
  isPending: boolean;
}) {
  const { t } = useTranslation('common');

  const showArabic =
    shopLanguage === ShopLanguage.Arabic ||
    shopLanguage === ShopLanguage.ArabicandEnglish;
  const showEnglish =
    shopLanguage === ShopLanguage.English ||
    shopLanguage === ShopLanguage.ArabicandEnglish;

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      nameEn: branch?.nameEn ?? '',
      nameAr: branch?.nameAr ?? branch?.name ?? '',
      zoneName: (branch as any)?.zoneName ?? '',
      phone: branch?.phoneNumber ?? '',
      address: branch?.addressText ?? '',
      latitude: branch?.centerLatitude != null ? String(branch.centerLatitude) : '',
      longitude: branch?.centerLongitude != null ? String(branch.centerLongitude) : '',
      coverageRadius:
        (branch as any)?.coverageRadius != null
          ? String((branch as any).coverageRadius)
          : '5000',
      is24Hours: (() => {
        const raw = branch as any;
        return raw?.openAt === '00:00:00' && raw?.closedAt === '23:59:59';
      })(),
      openAt: (() => {
        const raw = (branch as any)?.openAt;
        if (!raw || typeof raw !== 'string') return '';
        return raw.substring(0, 5);
      })(),
      closedAt: (() => {
        const raw = (branch as any)?.closedAt;
        if (!raw || typeof raw !== 'string') return '';
        return raw.substring(0, 5);
      })(),
      deliveryTime: (() => {
        const raw = (branch as any)?.deliveryTime;
        if (!raw || typeof raw !== 'string') return '';
        return raw.substring(0, 5);
      })(),
      enableDeliveryOrders: (branch as any)?.enableDeliveryOrders ?? true,
      isFixedDelivery: (branch as any)?.isFixedDelivery ?? false,
      deliveryCharge:
        (branch as any)?.deliveryCharge != null
          ? String((branch as any).deliveryCharge)
          : '',
    },
  });

  const is24Hours = form.watch('is24Hours');
  const enableDelivery = form.watch('enableDeliveryOrders');
  const isFixed = form.watch('isFixedDelivery');
  const lat = Number(form.watch('latitude') || 0);
  const lng = Number(form.watch('longitude') || 0);
  const radius = Number(form.watch('coverageRadius') || 0);

  async function handleSubmit(values: BranchFormValues) {
    const success = await onSave(values);
    if (success) {
      form.reset();
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {branch ? t('branches.edit') : t('branches.add')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-0"
          >
            <ScrollArea className="h-[65vh]">
              <div className="space-y-4 pe-3 pb-2">

                <div className="space-y-2">
                  <LocationPicker
                    lat={lat}
                    lng={lng}
                    radius={radius}
                    onLocationChange={(newLat, newLng, address) => {
                      form.setValue('latitude', String(newLat));
                      form.setValue('longitude', String(newLng));
                      if (address) form.setValue('address', address);
                    }}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="coverageRadius"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('branches.coverageRadius')}</FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputAddon mode="icon" className="bg-brand border-brand [&_svg]:text-white">
                            <Target />
                          </InputAddon>
                          <Input type="number" min={0} {...field} />
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(showEnglish || showArabic) && (
                  <div className="grid grid-cols-2 gap-4">
                    {showEnglish && (
                      <FormField
                        control={form.control}
                        name="nameEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('branches.nameEn')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {showArabic && (
                      <FormField
                        control={form.control}
                        name="nameAr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('branches.nameAr')}</FormLabel>
                            <FormControl>
                              <Input {...field} dir="rtl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="zoneName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('branches.zoneName')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('branches.phone')}</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('branches.address')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('branches.latitude')}</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('branches.longitude')}</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3 rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{t('branches.workingHours')}</p>

                  <FormField
                    control={form.control}
                    name="is24Hours"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer font-normal">
                            {t('branches.open24Hours')}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {!is24Hours && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="openAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('branches.openAt')}</FormLabel>
                            <FormControl>
                              <TimePicker value={field.value} onChange={field.onChange} disabled={field.disabled} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="closedAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('branches.closedAt')}</FormLabel>
                            <FormControl>
                              <TimePicker value={field.value} onChange={field.onChange} disabled={field.disabled} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3 rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{t('branches.deliverySettings')}</p>

                  <FormField
                    control={form.control}
                    name="deliveryTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('branches.deliveryTime')}</FormLabel>
                        <FormControl>
                          <TimePicker value={field.value} onChange={field.onChange} disabled={field.disabled} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enableDeliveryOrders"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                          <FormLabel className="font-normal">
                            {t('branches.enableDelivery')}
                          </FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value ?? true}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />

                  {enableDelivery && (
                    <FormField
                      control={form.control}
                      name="isFixedDelivery"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                            <FormLabel className="font-normal">
                              {t('branches.fixedDelivery')}
                            </FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}

                  {enableDelivery && isFixed && (
                    <FormField
                      control={form.control}
                      name="deliveryCharge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('branches.deliveryCharge')}</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

              </div>
            </ScrollArea>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t('actions.cancel')}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending} className="bg-brand hover:bg-brand/90 text-brand-foreground">
                {isPending && <LoaderCircle className="size-4 animate-spin" />}
                {t('actions.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────

function DeleteBranchDialog({
  open,
  onOpenChange,
  branch,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch?: FullBranchResponse;
  onConfirm: () => Promise<void>;
  isPending: boolean;
}) {
  const { t } = useTranslation('common');
  const branchName = branch?.nameEn ?? branch?.nameAr ?? t('branches.branch');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('branches.delete')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t('branches.deleteConfirm', { name: branchName })}
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t('actions.cancel')}
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {t('actions.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BranchesPage() {
  const { t } = useTranslation('common');
  usePageMeta(t('branches.title'));
  const { isOffline } = useOnlineStatus();

  const {
    data: branches = [],
    isLoading,
    isError,
    refetch,
  } = useBranches();

  const { data: shop } = useShopProfile();
  const shopLanguage = shop?.languages ?? ShopLanguage.ArabicandEnglish;

  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const { confirm } = useUIStore();
  const [search, setSearch] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<FullBranchResponse | undefined>();
  const [deletingBranch, setDeletingBranch] = useState<FullBranchResponse | undefined>();

  const filtered = useMemo(() => {
    if (search.trim() === '') return branches;
    const q = search.toLowerCase();
    return branches.filter((b) =>
      b.name?.toLowerCase().includes(q) ||
      b.nameEn?.toLowerCase().includes(q) ||
      b.nameAr?.toLowerCase().includes(q) ||
      b.phoneNumber?.toLowerCase().includes(q) ||
      b.addressText?.toLowerCase().includes(q),
    );
  }, [branches, search]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        meta: { cellClassName: 'w-10' },
      }),
      columnHelper.accessor((row) => row.name ?? row.nameEn ?? row.nameAr ?? '', {
        id: 'name',
        header: t('branches.name'),
        cell: ({ row }) => {
          const b = row.original;
          return (
            <div className="flex items-center gap-2 font-medium">
              {b.name ?? b.nameEn ?? b.nameAr ?? '—'}
              {b.isMain && (
                <Badge variant="secondary" size="sm">
                  {t('branches.main')}
                </Badge>
              )}
            </div>
          );
        },
        meta: { skeleton: <Skeleton className="h-4 w-32" /> },
      }),
      columnHelper.accessor('phoneNumber', {
        header: t('branches.phone'),
        cell: ({ getValue }) => getValue() ?? '—',
        meta: { skeleton: <Skeleton className="h-4 w-24" /> },
      }),
      columnHelper.accessor('addressText', {
        header: t('branches.address'),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() ?? '—'}</span>
        ),
        meta: { skeleton: <Skeleton className="h-4 w-40" /> },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="ltr:text-right rtl:text-left">{t('branches.actions')}</div>,
        cell: ({ row }) => {
          const branch = row.original;
          return (
            <div className="flex ltr:justify-end rtl:justify-start gap-1">
              <Button
                variant="ghost"
                mode="icon"
                size="sm"
                onClick={() => setEditBranch(branch)}
                aria-label={t('actions.edit')}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                mode="icon"
                size="sm"
                onClick={() => setDeletingBranch(branch)}
                aria-label={t('actions.delete')}
                disabled={branch.isMain}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          );
        },
        meta: { cellClassName: 'w-24' },
      }),
    ],
    [t, setEditBranch, setDeletingBranch],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getRowId: (row) => row.id,
    state: { rowSelection, sorting, columnVisibility },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    enableRowSelection: (row) => !row.original.isMain,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  function buildInput(values: BranchFormValues): Omit<BranchInput, 'shopId'> {
    const is24h = values.is24Hours ?? false;
    const hasDelivery = values.enableDeliveryOrders ?? true;
    const isFixed = hasDelivery && (values.isFixedDelivery ?? false);
    return {
      nameEn: values.nameEn ?? '',
      nameAr: values.nameAr ?? '',
      zoneName: values.zoneName,
      phoneNumber: values.phone,
      addressText: values.address || '',
      centerLatitude: values.latitude ? Number(values.latitude) : 0,
      centerLongitude: values.longitude ? Number(values.longitude) : 0,
      coverageRadius: values.coverageRadius ? Number(values.coverageRadius) : 0,
      openAt: is24h ? '00:00:00' : (values.openAt ? `${values.openAt}:00` : '09:00:00'),
      closedAt: is24h ? '23:59:59' : (values.closedAt ? `${values.closedAt}:00` : '22:00:00'),
      deliveryTime: values.deliveryTime ? `${values.deliveryTime}:00` : '00:30:00',
      enableDeliveryOrders: hasDelivery,
      isFixedDelivery: isFixed,
      deliveryCharge: isFixed ? Number(values.deliveryCharge || 0) : 0,
      deliveryPerKilo: 1,
      minimumDeliveryCharge: 1,
    };
  }

  async function handleCreate(values: BranchFormValues): Promise<boolean> {
    try {
      await createBranch.mutateAsync(buildInput(values));
      if (!isOffline) toast.success(t('branches.createSuccess'));
      return true;
    } catch (err) {
      console.error('[handleCreate]', err);
      toast.error(t('branches.createError'));
      return false;
    }
  }

  async function handleEdit(values: BranchFormValues): Promise<boolean> {
    if (!editBranch) return false;
    try {
      await updateBranch.mutateAsync({ id: editBranch.id, input: buildInput(values) });
      if (!isOffline) toast.success(t('branches.updateSuccess'));
      return true;
    } catch (err) {
      console.error('[handleEdit]', err);
      toast.error(t('branches.updateError'));
      return false;
    }
  }

  async function handleDelete() {
    if (!deletingBranch) return;
    try {
      await deleteBranch.mutateAsync(deletingBranch.id);
      if (!isOffline) toast.success(t('branches.deleteSuccess'));
      setDeletingBranch(undefined);
    } catch {
      toast.error(t('branches.deleteError'));
    }
  }

  function handleDeleteSelected() {
    const selectedRows = table.getSelectedRowModel().rows;
    const count = selectedRows.length;
    confirm({
      title: t('actions.delete'),
      description: t('branches.deleteSelectedConfirm', { count }),
      variant: 'destructive',
      onConfirm: async () => {
        try {
          for (const row of selectedRows) {
            await deleteBranch.mutateAsync(row.original.id);
          }
          setRowSelection({});
          if (!isOffline) toast.success(t('branches.deleteSelectedSuccess', { count }));
        } catch {
          toast.error(t('branches.deleteError'));
        }
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <AlertTitle>{t('branches.loadError')}</AlertTitle>
        </Alert>
        <Button className="mt-4" onClick={() => refetch()}>{t('actions.retry')}</Button>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      {/* Search + Columns + Add */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative w-44">
            <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              className="ltr:pl-9 rtl:pr-9 h-9"
              placeholder={t('actions.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <DataGridColumnVisibility
            table={table}
            trigger={
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Columns3 className="size-4" />
                {t('logs.columns')}
              </Button>
            }
          />
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="h-9 bg-brand hover:bg-brand/90 text-brand-foreground">
          <Plus className="size-4" />
          {t('branches.add')}
        </Button>
      </div>

      {/* Empty state */}
      {branches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <GitBranch className="size-12 text-muted-foreground" />
          <p className="text-muted-foreground">{t('branches.empty')}</p>
          <Button onClick={() => setCreateOpen(true)} className="bg-brand hover:bg-brand/90 text-brand-foreground">
            <Plus className="size-4" />
            {t('branches.add')}
          </Button>
        </div>
      )}

      {/* Selection action bar */}
      {table.getSelectedRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-2.5">
          <span className="text-sm text-muted-foreground">
            {t('branches.selectedCount', { count: table.getSelectedRowModel().rows.length })}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={deleteBranch.isPending}
          >
            <Trash2 className="size-4" />
            {t('actions.delete')} ({table.getSelectedRowModel().rows.length})
          </Button>
        </div>
      )}

      {/* DataGrid */}
      {branches.length > 0 && (
        <DataGrid
          table={table}
          recordCount={filtered.length}
          tableLayout={{ stripped: true, rowBorder: false, width: 'auto' }}
        >
          <DataGridContainer>
            <DataGridTable />
          </DataGridContainer>
          <DataGridPagination
            sizes={[10, 25, 50]}
            className="px-4 py-3 border-t border-border"
          />
        </DataGrid>
      )}

      {/* Create Dialog */}
      <BranchFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        shopLanguage={shopLanguage}
        onSave={handleCreate}
        isPending={createBranch.isPending}
      />

      {/* Edit Dialog */}
      <BranchFormDialog
        key={editBranch?.id}
        open={!!editBranch}
        onOpenChange={(open) => !open && setEditBranch(undefined)}
        branch={editBranch}
        shopLanguage={shopLanguage}
        onSave={handleEdit}
        isPending={updateBranch.isPending}
      />

      {/* Delete Dialog */}
      <DeleteBranchDialog
        open={!!deletingBranch}
        onOpenChange={(open) => !open && setDeletingBranch(undefined)}
        branch={deletingBranch}
        onConfirm={handleDelete}
        isPending={deleteBranch.isPending}
      />
    </div>
  );
}
