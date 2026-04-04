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
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABLE_LOCATIONS = [0, 1, 2] as const;
const TABLE_STATUSES = [0, 1, 2] as const;

const STATUS_CLASSES: Record<number, string> = {
  0: 'border-emerald-700 bg-emerald-600 text-white',
  1: 'border-rose-700 bg-rose-600 text-white',
  2: 'border-amber-400 bg-amber-300 text-slate-950',
};

function TableStatusBadge({
  status,
  label,
  className,
}: {
  status: (typeof TABLE_STATUSES)[number];
  label: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      size="sm"
      className={[
        'h-6 min-w-25 justify-center rounded-full px-2.5 font-semibold tracking-[0.01em]',
        STATUS_CLASSES[status],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </Badge>
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
    if (!hasSelectedBranch) {
      setSelectedBranchId(branches[0].id);
    }
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-64">
          <Select
            value={activeBranchId}
            onValueChange={setSelectedBranchId}
            disabled={branchesLoading}
          >
            <SelectTrigger>
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

        <Button
          onClick={() => setAddOpen(true)}
          disabled={!activeBranchId}
          className="bg-brand hover:bg-brand/90 text-brand-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('tables.add')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {!activeBranchId ? (
            <div className="p-10 text-center text-muted-foreground">
              {branchesLoading ? (
                <div className="p-10 flex justify-center">
                  <LoaderCircle className="size-6 animate-spin text-brand" />
                </div>
              ) : t('tables.selectBranchPrompt')}
            </div>
          ) : tablesLoading ? (
            <div className="p-10 flex justify-center">
              <LoaderCircle className="size-6 animate-spin text-brand" />
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-destructive">{t('tables.loadError')}</div>
          ) : !tables || tables.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">{t('tables.emptyState')}</div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tables.tableNumber')}</TableHead>
                  <TableHead>{t('tables.capacity')}</TableHead>
                  <TableHead>{t('tables.location')}</TableHead>
                  <TableHead>{t('tables.status')}</TableHead>
                  <TableHead className="ltr:text-right rtl:text-left">{t('tables.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell className="font-medium">{table.tableNumber}</TableCell>
                    <TableCell>{table.capacity}</TableCell>
                    <TableCell>{t(`tables.location${table.location}` as never)}</TableCell>
                    <TableCell>
                      <Select
                        indicatorVisibility={false}
                        value={String(table.tableStatus)}
                        onValueChange={(v) => onStatusChange(table, v)}
                        disabled={changeStatus.isPending}
                      >
                        <SelectTrigger className="h-9 w-38 justify-start rounded-xl border-border/70 bg-muted/20 px-2.5 shadow-none [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:justify-start">
                          <SelectValue>
                            <TableStatusBadge
                              status={table.tableStatus as (typeof TABLE_STATUSES)[number]}
                              label={t(`tables.status${table.tableStatus}` as never)}
                              className="min-w-0"
                            />
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/70 p-1 shadow-lg shadow-black/5">
                          {TABLE_STATUSES.map((s) => (
                            <SelectItem
                              key={s}
                              value={String(s)}
                              className="rounded-lg ps-2 pe-2 py-2 focus:bg-muted/70"
                            >
                              <TableStatusBadge
                                status={s}
                                label={t(`tables.status${s}` as never)}
                                className="w-full justify-start"
                              />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="ltr:text-right rtl:text-left">
                      <div className="inline-flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(table)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteTable(table)}
                          disabled={deleteTableMut.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
