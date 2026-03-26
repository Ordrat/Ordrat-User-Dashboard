'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import {
  LoaderCircle,
  Plus,
  Pencil,
  Trash2,
  GitBranch,
  TriangleAlert,
  Search,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

import { usePageMeta } from '@/hooks/use-page-meta';
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
  type BranchInput,
} from '@/lib/ordrat-api/branch';
import { useShopProfile } from '@/lib/ordrat-api/shop';
import { ShopLanguage, type FullBranchResponse } from '@/lib/ordrat-api/schemas';

// ─── Branch form schema ───────────────────────────────────────────────────────

const branchFormSchema = z.object({
  nameEn: z.string().optional(),
  nameAr: z.string().min(1, 'Required'),
  zoneName: z.string().min(1, 'Required'),
  phone: z.string().min(1, 'Required'),
  address: z.string().min(1, 'Required'),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type BranchFormValues = z.infer<typeof branchFormSchema>;

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
  onSave: (values: BranchFormValues) => Promise<void>;
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
      nameEn: branch?.nameEn ?? branch?.name ?? '',
      nameAr: branch?.nameAr ?? branch?.name ?? '',
      zoneName: (branch as any)?.zoneName ?? '',
      phone: branch?.phoneNumber ?? '',
      address: branch?.addressText ?? '',
      latitude: branch?.centerLatitude != null ? String(branch.centerLatitude) : '',
      longitude: branch?.centerLongitude != null ? String(branch.centerLongitude) : '',
    },
  });

  async function handleSubmit(values: BranchFormValues) {
    await onSave(values);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {branch ? t('branches.edit') : t('branches.add')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
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

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t('actions.cancel')}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
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
  const branchName =
    branch?.nameEn ?? branch?.nameAr ?? t('branches.branch');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('branches.delete')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t('branches.deleteConfirm')}
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
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : null}
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

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<FullBranchResponse | undefined>();
  const [deletingBranch, setDeletingBranch] = useState<
    FullBranchResponse | undefined
  >();

  // Client-side search filter
  const filtered =
    search.trim() === ''
      ? branches
      : branches.filter((b) => {
          const q = search.toLowerCase();
          return (
            b.name?.toLowerCase().includes(q) ||
            b.nameEn?.toLowerCase().includes(q) ||
            b.nameAr?.toLowerCase().includes(q) ||
            b.phoneNumber?.toLowerCase().includes(q) ||
            b.addressText?.toLowerCase().includes(q)
          );
        });

  function buildInput(values: BranchFormValues): Omit<BranchInput, 'shopId'> {
    return {
      nameEn: values.nameEn || undefined,
      nameAr: values.nameAr,
      zoneName: values.zoneName,
      phoneNumber: values.phone,
      addressText: values.address,
      centerLatitude: values.latitude ? Number(values.latitude) : 0,
      centerLongitude: values.longitude ? Number(values.longitude) : 0,
      openAt: '09:00:00',
      closedAt: '22:00:00',
      deliveryTime: '30',
      coverageRadius: 500,
      enableDeliveryOrders: true,
      isFixedDelivery: false,
      deliveryCharge: 0,
      deliveryPerKilo: 1,
      minimumDeliveryCharge: 1,
    };
  }

  async function handleCreate(values: BranchFormValues) {
    try {
      await createBranch.mutateAsync(buildInput(values));
      toast.success(t('branches.createSuccess'));
    } catch {
      toast.error(t('branches.createError'));
      throw new Error('create failed');
    }
  }

  async function handleEdit(values: BranchFormValues) {
    if (!editBranch) return;
    try {
      await updateBranch.mutateAsync({ id: editBranch.id, input: buildInput(values) });
      toast.success(t('branches.updateSuccess'));
    } catch {
      toast.error(t('branches.updateError'));
      throw new Error('update failed');
    }
  }

  async function handleDelete() {
    if (!deletingBranch) return;
    try {
      await deleteBranch.mutateAsync(deletingBranch.id);
      toast.success(t('branches.deleteSuccess'));
      setDeletingBranch(undefined);
    } catch {
      toast.error(t('branches.deleteError'));
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-5xl">
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
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('actions.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {t('branches.add')}
        </Button>
      </div>

      {/* Empty state */}
      {branches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <GitBranch className="size-12 text-muted-foreground" />
          <p className="text-muted-foreground">{t('branches.empty')}</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t('branches.add')}
          </Button>
        </div>
      )}

      {/* Table */}
      {branches.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('branches.name')}</TableHead>
                <TableHead>{t('branches.phone')}</TableHead>
                <TableHead>{t('branches.address')}</TableHead>
                <TableHead className="text-right">{t('branches.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    {t('branches.noResults', { query: search })}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">
                      {branch.name ?? branch.nameEn ?? branch.nameAr ?? '—'}
                      {branch.isMain && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {t('branches.main')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{branch.phoneNumber ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {branch.addressText ?? '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
