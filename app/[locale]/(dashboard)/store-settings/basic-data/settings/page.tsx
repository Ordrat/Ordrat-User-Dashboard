'use client';

import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { LoaderCircle, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useShopSettings,
  useUpdateSettings,
  useWorkingHours,
  useCreateWorkingHours,
  useUpdateWorkingHours,
  WorkingHoursInput,
} from '@/lib/ordrat-api/settings';
import { TransactionType, ShippingPricingMethod } from '@/lib/ordrat-api/schemas';

// ─── Form schemas ─────────────────────────────────────────────────────────────

const cityPriceSchema = z.object({
  id: z.string().optional(),
  city: z.string().min(1, 'City name is required'),
  price: z.string().min(1, 'Price is required'),
});

const settingsFormSchema = z.object({
  transactionType: z.string(),
  deliveryFeeValue: z.string(),
  shippingPricingMethod: z.string(),
  fixedShippingPrice: z.string().optional(),
  cityPrices: z.array(cityPriceSchema),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

// ─── Day names ────────────────────────────────────────────────────────────────

const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

type WorkingHoursFormDay = {
  dayOfWeek: number;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
  id?: string;
};

export default function ShopSettingsPage() {
  const { t } = useTranslation('common');
  const { data: session } = useSession();
  const shopId = session?.user?.shopId ?? '';

  // Settings
  const {
    data: settings,
    isLoading: settingsLoading,
    isError: settingsError,
    refetch: refetchSettings,
  } = useShopSettings();
  const updateSettings = useUpdateSettings();

  // Working Hours
  const {
    data: workingHours = [],
    isLoading: hoursLoading,
    isError: hoursError,
    refetch: refetchHours,
  } = useWorkingHours();
  const createHours = useCreateWorkingHours();
  const updateHours = useUpdateWorkingHours();

  // ─── Settings form ────────────────────────────────────────────────────────

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      transactionType: String(TransactionType.Percentage),
      deliveryFeeValue: '0',
      shippingPricingMethod: String(ShippingPricingMethod.Fixed),
      fixedShippingPrice: '0',
      cityPrices: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: settingsForm.control,
    name: 'cityPrices',
  });

  useEffect(() => {
    if (settings) {
      settingsForm.reset({
        transactionType: String(settings.transactionType),
        deliveryFeeValue: String(settings.deliveryFeeValue),
        shippingPricingMethod: String(settings.shippingPricingMethod),
        fixedShippingPrice: settings.fixedShippingPrice != null ? String(settings.fixedShippingPrice) : '0',
        cityPrices: (settings.cityPrices ?? []).map((cp) => ({
          id: cp.id,
          city: cp.city,
          price: String(cp.price),
        })),
      });
    }
  }, [settings, settingsForm]);

  const shippingMethod = Number(settingsForm.watch('shippingPricingMethod'));
  const transactionType = Number(settingsForm.watch('transactionType'));

  async function onSettingsSubmit(values: SettingsFormValues) {
    try {
      await updateSettings.mutateAsync({
        transactionType: Number(values.transactionType),
        deliveryFeeValue: Number(values.deliveryFeeValue),
        shippingPricingMethod: Number(values.shippingPricingMethod),
        fixedShippingPrice:
          shippingMethod === ShippingPricingMethod.Fixed
            ? Number(values.fixedShippingPrice)
            : undefined,
        cityPrices:
          shippingMethod === ShippingPricingMethod.PricePerCity
            ? values.cityPrices.map(({ city, price }) => ({ city, price: Number(price) }))
            : undefined,
      });
      toast.success(t('settings.saveSuccess'));
    } catch {
      toast.error(t('settings.saveError'));
    }
  }

  // ─── Working hours state ──────────────────────────────────────────────────

  const [hoursState, setHoursState] = React.useState<WorkingHoursFormDay[]>(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        isClosed: false,
        openTime: '09:00',
        closeTime: '22:00',
        id: undefined,
      })),
  );

  useEffect(() => {
    if (workingHours.length > 0) {
      setHoursState(
        Array.from({ length: 7 }, (_, i) => {
          const existing = workingHours.find((h) => h.dayOfWeek === i);
          return {
            dayOfWeek: i,
            isClosed: existing?.isClosed ?? false,
            openTime: existing?.openTime ?? '09:00',
            closeTime: existing?.closeTime ?? '22:00',
            id: existing?.id,
          };
        }),
      );
    }
  }, [workingHours]);

  function updateDay(index: number, patch: Partial<WorkingHoursFormDay>) {
    setHoursState((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );
  }

  async function onHoursSubmit() {
    try {
      await Promise.all(
        hoursState.map((day) => {
          const input: WorkingHoursInput = {
            shopId,
            dayOfWeek: day.dayOfWeek,
            openTime: day.isClosed ? undefined : day.openTime,
            closeTime: day.isClosed ? undefined : day.closeTime,
            isClosed: day.isClosed,
          };
          if (day.id) {
            return updateHours.mutateAsync({
              id: day.id,
              input: {
                dayOfWeek: input.dayOfWeek,
                openTime: input.openTime,
                closeTime: input.closeTime,
                isClosed: input.isClosed,
              },
            });
          }
          return createHours.mutateAsync(input);
        }),
      );
      toast.success(t('workingHours.saveSuccess'));
    } catch {
      toast.error(t('workingHours.saveError'));
    }
  }

  const isLoadingAny = settingsLoading || hoursLoading;
  const isSavingHours = createHours.isPending || updateHours.isPending;

  if (isLoadingAny) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  if (settingsError || hoursError) {
    return (
      <div className="p-6">
        <Alert variant="destructive" appearance="light">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <AlertTitle>{t('settings.loadError')}</AlertTitle>
        </Alert>
        <Button
          className="mt-4"
          onClick={() => {
            refetchSettings();
            refetchHours();
          }}
        >
          {t('actions.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>

      {/* Settings Form */}
      <Form {...settingsForm}>
        <form
          onSubmit={settingsForm.handleSubmit(onSettingsSubmit)}
          className="space-y-4"
        >
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={settingsForm.control}
                  name="transactionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.transactionType')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={String(TransactionType.Percentage)}>{t('settings.transactionTypePercentage')}</SelectItem>
                          <SelectItem value={String(TransactionType.Flat)}>{t('settings.transactionTypeFlat')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={settingsForm.control}
                  name="deliveryFeeValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {transactionType === TransactionType.Percentage
                          ? t('settings.deliveryFeePercent')
                          : t('settings.deliveryFeeFlat')}
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={settingsForm.control}
                name="shippingPricingMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.shippingMethod')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={String(ShippingPricingMethod.Fixed)}>{t('settings.shippingFixed')}</SelectItem>
                        <SelectItem value={String(ShippingPricingMethod.PricePerCity)}>{t('settings.shippingPerCity')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {shippingMethod === ShippingPricingMethod.Fixed && (
                <FormField
                  control={settingsForm.control}
                  name="fixedShippingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('settings.fixedPrice')}</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {shippingMethod === ShippingPricingMethod.PricePerCity && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t('settings.cityPrices')}</p>
                  {fields.map((fieldItem, index) => (
                    <div key={fieldItem.id} className="flex items-center gap-2">
                      <FormField
                        control={settingsForm.control}
                        name={`cityPrices.${index}.city`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder={t('settings.cityName')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={settingsForm.control}
                        name={`cityPrices.${index}.price`}
                        render={({ field }) => (
                          <FormItem className="w-28">
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder={t('settings.price')}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        mode="icon"
                        size="sm"
                        onClick={() => remove(index)}
                        aria-label={t('settings.removeCity')}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ city: '', price: '0' })}
                  >
                    <Plus className="size-4" />
                    {t('settings.addCity')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              {t('actions.save')}
            </Button>
          </div>
        </form>
      </Form>

      {/* Working Hours */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t('workingHours.title')}</h2>
        <Card>
          <CardContent className="p-6 divide-y">
            {hoursState.map((day, index) => (
              <div
                key={day.dayOfWeek}
                className="py-3 flex flex-wrap items-center gap-4"
              >
                <span className="w-24 font-medium capitalize text-sm">
                  {t(`workingHours.${DAY_NAMES[day.dayOfWeek]}`)}
                </span>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={!day.isClosed}
                    onCheckedChange={(open) =>
                      updateDay(index, { isClosed: !open })
                    }
                    aria-label={`Toggle ${DAY_NAMES[day.dayOfWeek]}`}
                  />
                  <span className="text-sm text-muted-foreground">
                    {day.isClosed ? t('workingHours.closed') : t('workingHours.open')}
                  </span>
                </div>

                {!day.isClosed && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-muted-foreground">
                        {t('workingHours.openTime')}
                      </label>
                      <Input
                        type="time"
                        value={day.openTime}
                        onChange={(e) =>
                          updateDay(index, { openTime: e.target.value })
                        }
                        className="w-32"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-muted-foreground">
                        {t('workingHours.closeTime')}
                      </label>
                      <Input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) =>
                          updateDay(index, { closeTime: e.target.value })
                        }
                        className="w-32"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={onHoursSubmit} disabled={isSavingHours}>
            {isSavingHours ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : null}
            {t('actions.save')} {t('workingHours.title')}
          </Button>
        </div>
      </div>
    </div>
  );
}
