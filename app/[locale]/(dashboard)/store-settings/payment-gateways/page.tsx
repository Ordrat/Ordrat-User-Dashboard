'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, Building2, CircleCheck, type LucideIcon, Wallet, LoaderCircle, Settings } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

import { usePageMeta } from '@/hooks/use-page-meta';
import { useOnlineStatus } from '@/hooks/use-online-status';
import {
  usePaymentGateways,
  useCreatePaymentGateway,
  useUpdatePaymentGateway,
} from '@/lib/ordrat-api/payment-gateway';
import { PaymentGatewayResponse } from '@/lib/ordrat-api/schemas';

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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

// ─── Form schema ──────────────────────────────────────────────────────────────

const gatewayFormSchema = z.object({
  gatewayNameEn: z.string().optional(),
  gatewayNameAr: z.string().optional(),
  gatewayDescriptionEn: z.string().optional(),
  gatewayDescriptionAr: z.string().optional(),
  priority: z.number().min(0),
  isEnabled: z.boolean(),
});

type GatewayFormValues = z.infer<typeof gatewayFormSchema>;

const PAYMENT_METHODS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const PAYMENT_METHOD_VISUALS: Record<
  number,
  {
    src?: string;
    icon?: LucideIcon;
  }
> = {
  0: { icon: Banknote },
  1: { src: '/media/brand-logos/visa.svg' },
  2: { src: '/media/brand-logos/paypal.svg' },
  3: { src: '/media/payment-gateway/kashier.png' },
  4: { src: '/media/payment-gateway/vf-cash.png' },
  5: { src: '/media/payment-gateway/orange-cash.png' },
  6: { src: '/media/payment-gateway/ET-cash.png' },
  7: { src: '/media/payment-gateway/instapay.png' },
  8: { src: '/media/brand-logos/stripe.svg' },
  9: { icon: Building2 },
};

const PAYMENT_METHOD_TILE_STYLES: Record<number, { backgroundColor: string; borderColor: string }> = {
  6: { backgroundColor: '#ee2424', borderColor: '#ee2424' },
  7: { backgroundColor: '#4c0c6e', borderColor: '#4c0c6e' },
};

function getPaymentMethodTileStyle(method: number) {
  return PAYMENT_METHOD_TILE_STYLES[method];
}

function PaymentMethodLogo({ method }: { method: number }) {
  const visual = PAYMENT_METHOD_VISUALS[method];

  if (visual?.src) {
    return <img src={visual.src} alt="" className="h-full w-full object-contain" />;
  }

  const Icon = visual?.icon ?? Wallet;
  return <Icon aria-hidden="true" className="h-full w-full text-muted-foreground" strokeWidth={1.75} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PaymentGatewaysPage() {
  const { t } = useTranslation('common');
  usePageMeta(t('paymentGateways.title'));

  const { isOffline } = useOnlineStatus();
  const { data: gateways, isLoading, isError } = usePaymentGateways();
  const createGateway = useCreatePaymentGateway();
  const updateGateway = useUpdatePaymentGateway();

  const [configureOpen, setConfigureOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [editingGateway, setEditingGateway] = useState<PaymentGatewayResponse | null>(null);

  const form = useForm<GatewayFormValues>({
    resolver: zodResolver(gatewayFormSchema),
    defaultValues: {
      gatewayNameEn: '',
      gatewayNameAr: '',
      gatewayDescriptionEn: '',
      gatewayDescriptionAr: '',
      priority: 0,
      isEnabled: true,
    },
  });

  const gatewaysByMethod = useMemo(() => {
    const map = new Map<number, PaymentGatewayResponse>();
    (gateways ?? []).forEach((gateway) => {
      if (!map.has(gateway.paymentMethod)) {
        map.set(gateway.paymentMethod, gateway);
      }
    });
    return map;
  }, [gateways]);

  function openConfigure(method: number) {
    const existingGateway = gatewaysByMethod.get(method) ?? null;
    setSelectedMethod(method);
    setEditingGateway(existingGateway);
    form.reset({
      gatewayNameEn: existingGateway?.gatewayNameEn ?? '',
      gatewayNameAr: existingGateway?.gatewayNameAr ?? '',
      gatewayDescriptionEn: existingGateway?.gatewayDescriptionEn ?? '',
      gatewayDescriptionAr: existingGateway?.gatewayDescriptionAr ?? '',
      priority: existingGateway?.priority ?? 0,
      isEnabled: existingGateway?.isEnabled ?? true,
    });
    setConfigureOpen(true);
  }

  function handleConfigureOpenChange(open: boolean) {
    setConfigureOpen(open);
    if (!open) {
      setSelectedMethod(null);
      setEditingGateway(null);
    }
  }

  async function onConfigure(values: GatewayFormValues) {
    if (selectedMethod === null) return;

    const payload = {
      paymentMethod: selectedMethod,
      gatewayNameEn: values.gatewayNameEn || null,
      gatewayNameAr: values.gatewayNameAr || null,
      gatewayDescriptionEn: values.gatewayDescriptionEn || null,
      gatewayDescriptionAr: values.gatewayDescriptionAr || null,
      priority: values.priority,
      isEnabled: values.isEnabled,
    };

    try {
      if (editingGateway) {
        await updateGateway.mutateAsync({
          id: editingGateway.id,
          input: payload,
        });
        if (!isOffline) toast.success(t('paymentGateways.updateSuccess'));
      } else {
        await createGateway.mutateAsync(payload);
        if (!isOffline) toast.success(t('paymentGateways.createSuccess'));
      }

      handleConfigureOpenChange(false);
    } catch (err: unknown) {
      const msg = String((err as Error)?.message ?? '');
      if (msg.includes('409')) {
        toast.error(t('paymentGateways.conflict'));
      } else if (editingGateway) {
        toast.error(t('paymentGateways.updateError'));
      } else {
        toast.error(t('paymentGateways.createError'));
      }
    }
  }

  const isPending = createGateway.isPending || updateGateway.isPending;

  return (
    <div className="p-6 space-y-6">
      {isLoading ? (
        <div className="p-10 flex justify-center">
          <LoaderCircle className="size-6 animate-spin text-brand" />
        </div>
      ) : isError ? (
        <div className="text-center text-destructive py-16">{t('paymentGateways.loadError')}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PAYMENT_METHODS.map((method) => (
            <PaymentMethodCard
              key={method}
              method={method}
              gateway={gatewaysByMethod.get(method)}
              t={t}
              onConfigure={() => openConfigure(method)}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Configure Dialog */}
      <Dialog open={configureOpen} onOpenChange={handleConfigureOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('paymentGateways.configure')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onConfigure)} className="space-y-4">
              <GatewayFormFields form={form} t={t} selectedMethod={selectedMethod} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleConfigureOpenChange(false)}>
                  {t('actions.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="min-w-28 bg-brand text-brand-foreground hover:bg-brand/90"
                  disabled={isPending || selectedMethod === null}
                >
                  {isPending && <LoaderCircle className="size-4 animate-spin" />}
                  {isPending ? t('actions.saving') : t('actions.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Payment Method Card ──────────────────────────────────────────────────────

function PaymentMethodCard({
  method,
  gateway,
  t,
  onConfigure,
  isPending,
}: {
  method: number;
  gateway?: PaymentGatewayResponse;
  t: (key: string) => string;
  onConfigure: () => void;
  isPending: boolean;
}) {
  const methodName = t(`paymentGateways.method${method}` as never);
  const configuredName = gateway?.gatewayNameEn || gateway?.gatewayNameAr || null;
  const showMethodLabel = Boolean(configuredName && configuredName.trim() && configuredName !== methodName);
  const name = showMethodLabel ? configuredName : methodName;
  const statusLabel = gateway
    ? gateway.isEnabled
      ? t('paymentGateways.enabled')
      : t('paymentGateways.disabled')
    : t('paymentGateways.notConfigured');
  const statusBadgeVariant = gateway
    ? gateway.isEnabled
      ? 'success'
      : 'destructive'
    : 'warning';
  const gatewayDescription = t(`paymentGateways.method${method}Desc` as never);

  return (
    <Card className="flex flex-col rounded-2xl border border-border/70 bg-card shadow-sm shadow-black/5">
      <CardContent className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background p-2.5 dark:bg-white dark:border-white/20"
            style={getPaymentMethodTileStyle(method)}
          >
            <PaymentMethodLogo method={method} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-lg font-semibold leading-tight text-foreground">{name}</p>
                  <Settings className="size-3.5 shrink-0 text-muted-foreground" />
                </div>
                {showMethodLabel ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{methodName}</p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <Badge
                  variant={statusBadgeVariant}
                  appearance="light"
                  size="sm"
                  className="h-5 gap-1 px-1.5 font-medium"
                >
                  {gateway?.isEnabled ? (
                    <CircleCheck className="size-2.5" aria-hidden="true" />
                  ) : null}
                  {statusLabel}
                </Badge>
                {gateway && gateway.priority > 0 ? (
                  <Badge variant="secondary" appearance="light" size="sm" className="h-5 px-1.5 font-medium">
                    {t('paymentGateways.priority')}: {gateway.priority}
                  </Badge>
                ) : null}
              </div>
            </div>

            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {gatewayDescription}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-auto w-full border-border/70 bg-background text-foreground hover:bg-muted/60"
          onClick={onConfigure}
          disabled={isPending}
        >
          {t('paymentGateways.configure')}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Shared form fields ───────────────────────────────────────────────────────

function GatewayFormFields({
  form,
  t,
  selectedMethod,
}: {
  form: UseFormReturn<GatewayFormValues>;
  t: (key: string) => string;
  selectedMethod: number | null;
}) {
  const methodLabel =
    selectedMethod === null
      ? t('paymentGateways.selectMethod')
      : t(`paymentGateways.method${selectedMethod}` as never);

  return (
    <>
      <FormItem>
        <FormLabel>{t('paymentGateways.method')}</FormLabel>
        <div className="flex items-center gap-3 rounded-md border border-input bg-muted/40 px-3 py-2">
          {selectedMethod !== null && (
            <div
              className="size-12 rounded-lg border border-border bg-background p-1.5 shrink-0 dark:bg-white dark:border-white/20"
              style={getPaymentMethodTileStyle(selectedMethod)}
            >
              <PaymentMethodLogo method={selectedMethod} />
            </div>
          )}
          <span className="text-sm font-medium">{methodLabel}</span>
        </div>
      </FormItem>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="gatewayNameEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('paymentGateways.nameEn')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gatewayNameAr"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('paymentGateways.nameAr')}</FormLabel>
              <FormControl>
                <Input {...field} dir="rtl" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gatewayDescriptionEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('paymentGateways.descriptionEn')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gatewayDescriptionAr"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('paymentGateways.descriptionAr')}</FormLabel>
              <FormControl>
                <Input {...field} dir="rtl" />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('paymentGateways.priority')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
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
          name="isEnabled"
          render={({ field }) => (
            <FormItem className="flex items-end gap-2 pb-2">
              <FormLabel>{t('paymentGateways.enabled')}</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
