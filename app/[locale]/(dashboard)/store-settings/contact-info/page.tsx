'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Trash2, Check, X, ChevronDown, LoaderCircle } from 'lucide-react';

import { usePageMeta } from '@/hooks/use-page-meta';
import { useOnlineStatus } from '@/hooks/use-online-status';
import {
  useContactInfo,
  useCreateContactInfo,
  useUpdateContactInfo,
  useDeleteContactInfo,
} from '@/lib/ordrat-api/contact-info';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// ─── Gulf countries with phone codes ──────────────────────────────────────────

type GulfCountry = {
  code: string;
  dialCode: string;
  flag: string;
  nameEn: string;
  nameAr: string;
  format: string;
};

const GULF_COUNTRIES: GulfCountry[] = [
  { code: 'EG', dialCode: '+20', flag: '🇪🇬', nameEn: 'Egypt', nameAr: 'مصر', format: 'XXX XXX XXXX' },
  { code: 'SA', dialCode: '+966', flag: '🇸🇦', nameEn: 'Saudi Arabia', nameAr: 'السعودية', format: 'XXX XXX XXXX' },
  { code: 'AE', dialCode: '+971', flag: '🇦🇪', nameEn: 'UAE', nameAr: 'الإمارات', format: 'XX XXX XXXX' },
  { code: 'KW', dialCode: '+965', flag: '🇰🇼', nameEn: 'Kuwait', nameAr: 'الكويت', format: 'XXXX XXXX' },
  { code: 'QA', dialCode: '+974', flag: '🇶🇦', nameEn: 'Qatar', nameAr: 'قطر', format: 'XXXX XXXX' },
  { code: 'BH', dialCode: '+973', flag: '🇧🇭', nameEn: 'Bahrain', nameAr: 'البحرين', format: 'XXXX XXXX' },
  { code: 'OM', dialCode: '+968', flag: '🇴🇲', nameEn: 'Oman', nameAr: 'عُمان', format: 'XXXX XXXX' },
  { code: 'IQ', dialCode: '+964', flag: '🇮🇶', nameEn: 'Iraq', nameAr: 'العراق', format: 'XXX XXX XXXX' },
  { code: 'YE', dialCode: '+967', flag: '🇾🇪', nameEn: 'Yemen', nameAr: 'اليمن', format: 'XXX XXX XXX' },
  { code: 'JO', dialCode: '+962', flag: '🇯🇴', nameEn: 'Jordan', nameAr: 'الأردن', format: 'X XXXX XXXX' },
];

function parsePhoneCountry(phone: string) {
  if (!phone) return { country: GULF_COUNTRIES[0], local: '' };
  const sorted = [...GULF_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    if (phone.startsWith(c.dialCode)) {
      return { country: c, local: phone.slice(c.dialCode.length).trim() };
    }
  }
  return { country: GULF_COUNTRIES[0], local: phone.replace(/^\+/, '') };
}

function formatPhoneLocal(value: string, format: string): string {
  const digits = value.replace(/\D/g, '');
  let result = '';
  let di = 0;
  for (const ch of format) {
    if (ch === 'X') {
      result += digits[di] ?? '_';
      di += 1;
    } else {
      result += ch;
    }
  }
  return result;
}

function getPhoneSlotPositions(format: string): number[] {
  return Array.from(format).flatMap((ch, index) => (ch === 'X' ? [index] : []));
}

function getPhoneSlotCountBeforeCaret(caret: number, format: string): number {
  return getPhoneSlotPositions(format).filter((position) => position < caret).length;
}

function getPhoneSlotIndexAtCaret(caret: number, format: string): number {
  const slotPositions = getPhoneSlotPositions(format);
  const slotIndex = slotPositions.findIndex((position) => position >= caret);
  return slotIndex === -1 ? slotPositions.length : slotIndex;
}

function getPhoneCaretFromSlotIndex(slotIndex: number, format: string): number {
  const slotPositions = getPhoneSlotPositions(format);

  if (slotPositions.length === 0) return 0;
  if (slotIndex <= 0) return slotPositions[0];
  if (slotIndex >= slotPositions.length) return format.length;

  return slotPositions[slotIndex];
}

// ─── Form schema ──────────────────────────────────────────────────────────────

const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
const urlRegex = /^https?:\/\/.+/;

const contactInfoSchema = z.object({
  whatsAppNumber: z
    .string()
    .optional()
    .refine((v) => !v || phoneRegex.test(v), { message: 'invalidPhone' }),
  facebookLink: z
    .string()
    .optional()
    .refine((v) => !v || urlRegex.test(v), { message: 'invalidUrl' }),
  xLink: z
    .string()
    .optional()
    .refine((v) => !v || urlRegex.test(v), { message: 'invalidUrl' }),
  instagramLink: z
    .string()
    .optional()
    .refine((v) => !v || urlRegex.test(v), { message: 'invalidUrl' }),
});

type ContactInfoFormValues = z.infer<typeof contactInfoSchema>;

const SOCIAL_ICONS = {
  whatsapp: '/media/brand-logos/whatsapp.svg',
  facebook: '/media/brand-logos/facebook.svg',
  x: '/media/brand-logos/x.svg',
  xDark: '/media/brand-logos/x-dark.svg',
  instagram: '/media/brand-logos/instagram.svg',
} as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactInfoPage() {
  const { t, i18n } = useTranslation('common');
  const isRtl = i18n.dir() === 'rtl';
  usePageMeta(t('contactInfo.title'));

  const { isOffline } = useOnlineStatus();

  const { data: contactInfo, isLoading } = useContactInfo();
  const createContactInfo = useCreateContactInfo();
  const updateContactInfo = useUpdateContactInfo();
  const deleteContactInfo = useDeleteContactInfo();

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(GULF_COUNTRIES[0]);
  const [countryOpen, setCountryOpen] = useState(false);
  const whatsAppInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<ContactInfoFormValues>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      whatsAppNumber: '',
      facebookLink: '',
      xLink: '',
      instagramLink: '',
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (contactInfo) {
      const { country, local } = parsePhoneCountry(contactInfo.whatsAppNumber ?? '');
      setSelectedCountry(country);
      form.reset({
        whatsAppNumber: local ? `${country.dialCode}${local}` : '',
        facebookLink: contactInfo.facebookLink ?? '',
        xLink: contactInfo.xLink ?? '',
        instagramLink: contactInfo.instagramLink ?? '',
      });
    }
  }, [contactInfo, form]);

  async function onSubmit(values: ContactInfoFormValues) {
    const payload = {
      whatsAppNumber: values.whatsAppNumber || null,
      facebookLink: values.facebookLink || null,
      xLink: values.xLink || null,
      instagramLink: values.instagramLink || null,
    };

    try {
      if (contactInfo) {
        await updateContactInfo.mutateAsync({ id: contactInfo.id, input: payload });
      } else {
        await createContactInfo.mutateAsync(payload);
      }
      if (!isOffline) toast.success(t('contactInfo.saveSuccess'));
    } catch {
      toast.error(t('contactInfo.saveError'));
    }
  }

  async function handleDeleteConfirm() {
    if (!contactInfo) return;
    try {
      await deleteContactInfo.mutateAsync(contactInfo.id);
      form.reset({ whatsAppNumber: '', facebookLink: '', xLink: '', instagramLink: '' });
      setConfirmingDelete(false);
      if (!isOffline) toast.success(t('contactInfo.deleteSuccess'));
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 404) {
        toast.info(t('contactInfo.deleteSuccess'));
      } else {
        toast.error(t('contactInfo.deleteError'));
      }
      setConfirmingDelete(false);
    }
  }

  function handleWhatsAppChange(localValue: string, onChange: (v: string) => void) {
    const digits = localValue.replace(/\D/g, '');
    onChange(digits ? `${selectedCountry.dialCode}${digits}` : '');
  }

  function moveWhatsAppCaret(input: HTMLInputElement, slotIndex: number) {
    const nextCaret = getPhoneCaretFromSlotIndex(slotIndex, selectedCountry.format);
    requestAnimationFrame(() => {
      input.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function handleWhatsAppKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    value: string,
    onChange: (value: string) => void,
  ) {
    const input = event.currentTarget;
    const digits = value.replace(/\D/g, '');
    const maxDigits = getPhoneSlotPositions(selectedCountry.format).length;
    const selectionStart = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const hasSelection = selectionStart !== selectionEnd;
    const replaceStart = getPhoneSlotIndexAtCaret(selectionStart, selectedCountry.format);
    const replaceEnd = getPhoneSlotCountBeforeCaret(selectionEnd, selectedCountry.format);

    if (/^\d$/.test(event.key)) {
      event.preventDefault();

      const nextDigits = digits.split('');

      if (hasSelection) {
        nextDigits.splice(replaceStart, Math.max(replaceEnd - replaceStart, 0), event.key);
      } else if (replaceStart < digits.length) {
        nextDigits[replaceStart] = event.key;
      } else {
        nextDigits.splice(replaceStart, 0, event.key);
      }

      onChange(nextDigits.join('').slice(0, maxDigits));
      moveWhatsAppCaret(input, Math.min(replaceStart + 1, maxDigits));
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();

      const nextDigits = digits.split('');

      if (hasSelection) {
        nextDigits.splice(replaceStart, Math.max(replaceEnd - replaceStart, 0));
        onChange(nextDigits.join(''));
        moveWhatsAppCaret(input, replaceStart);
        return;
      }

      const deleteIndex = getPhoneSlotCountBeforeCaret(selectionStart, selectedCountry.format) - 1;
      if (deleteIndex < 0) {
        moveWhatsAppCaret(input, 0);
        return;
      }

      nextDigits.splice(deleteIndex, 1);
      onChange(nextDigits.join(''));
      moveWhatsAppCaret(input, deleteIndex);
      return;
    }

    if (event.key === 'Delete') {
      event.preventDefault();

      const nextDigits = digits.split('');

      if (hasSelection) {
        nextDigits.splice(replaceStart, Math.max(replaceEnd - replaceStart, 0));
        onChange(nextDigits.join(''));
        moveWhatsAppCaret(input, replaceStart);
        return;
      }

      const deleteIndex = getPhoneSlotIndexAtCaret(selectionStart, selectedCountry.format);
      nextDigits.splice(deleteIndex, 1);
      onChange(nextDigits.join(''));
      moveWhatsAppCaret(input, deleteIndex);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveWhatsAppCaret(input, Math.max(getPhoneSlotCountBeforeCaret(selectionStart, selectedCountry.format) - 1, 0));
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveWhatsAppCaret(input, Math.min(getPhoneSlotIndexAtCaret(selectionEnd, selectedCountry.format) + 1, maxDigits));
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      moveWhatsAppCaret(input, 0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      moveWhatsAppCaret(input, maxDigits);
    }
  }

  function handleWhatsAppCaretSnap(input: HTMLInputElement, value: string, lockToFilledSlots = false) {
    const digits = value.replace(/\D/g, '');
    const selectionStart = input.selectionStart ?? 0;
    const rawSlotIndex = getPhoneSlotIndexAtCaret(selectionStart, selectedCountry.format);
    const nextSlotIndex = lockToFilledSlots ? Math.min(rawSlotIndex, digits.length) : rawSlotIndex;

    moveWhatsAppCaret(input, nextSlotIndex);
  }

  const isPending = createContactInfo.isPending || updateContactInfo.isPending;

  // Derive local part for display
  const whatsAppFull = form.watch('whatsAppNumber') ?? '';
  const { local: displayLocal } = parsePhoneCountry(whatsAppFull);
  const formattedLocal = formatPhoneLocal(displayLocal, selectedCountry.format);

  return (
    <div className="space-y-6">
      {contactInfo && (
        <div className="flex justify-end">
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('contactInfo.deleteConfirmShort')}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={deleteContactInfo.isPending}
              >
                <Check className="w-4 h-4 ltr:mr-1 rtl:ml-1" />
                {t('actions.confirm')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmingDelete(false)}
              >
                <X className="w-4 h-4 ltr:mr-1 rtl:ml-1" />
                {t('actions.cancel')}
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmingDelete(true)}
              disabled={deleteContactInfo.isPending}
            >
              <Trash2 className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {t('actions.delete')}
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="p-10 flex justify-center">
          <LoaderCircle className="size-6 animate-spin text-brand" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {contactInfo ? t('actions.edit') : t('actions.add')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="whatsAppNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center justify-center rounded-sm dark:bg-[#25D366] dark:p-0.5">
                            <img
                              src={SOCIAL_ICONS.whatsapp}
                              alt=""
                              aria-hidden="true"
                              className="size-5 object-contain"
                            />
                          </span>
                          {t('contactInfo.whatsApp')}
                        </FormLabel>
                        <FormControl>
                          <div className="flex" dir="ltr">
                            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="flex h-9 items-center gap-1 rounded-s-md border border-e-0 border-input bg-muted px-2 text-sm hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                  <span className="text-base leading-none">{selectedCountry.flag}</span>
                                  <span className="text-xs text-muted-foreground">{selectedCountry.dialCode}</span>
                                  <ChevronDown className="size-3 text-muted-foreground" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-52 p-1" align="start">
                                {GULF_COUNTRIES.map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                                    onClick={() => {
                                      setSelectedCountry(c);
                                      setCountryOpen(false);
                                      // Update the stored value with new dial code
                                      const digits = (field.value ?? '').replace(/\D/g, '');
                                      const { local } = parsePhoneCountry(field.value ?? '');
                                      const localDigits = local.replace(/\D/g, '');
                                      field.onChange(localDigits ? `${c.dialCode}${localDigits}` : '');
                                    }}
                                  >
                                    <span className="text-base leading-none">{c.flag}</span>
                                    <span className="flex-1 text-start">{isRtl ? c.nameAr : c.nameEn}</span>
                                    <span className="text-xs text-muted-foreground">{c.dialCode}</span>
                                  </button>
                                ))}
                              </PopoverContent>
                            </Popover>
                            <Input
                              value={formattedLocal}
                              onFocus={(e) => {
                                whatsAppInputRef.current = e.currentTarget;
                                handleWhatsAppCaretSnap(e.currentTarget, displayLocal, true);
                              }}
                              onClick={(e) => {
                                whatsAppInputRef.current = e.currentTarget;
                                handleWhatsAppCaretSnap(e.currentTarget, displayLocal);
                              }}
                              onKeyDown={(e) => handleWhatsAppKeyDown(e, displayLocal, (nextDigits) => {
                                field.onChange(nextDigits ? `${selectedCountry.dialCode}${nextDigits}` : '');
                              })}
                              onChange={(e) => {
                                handleWhatsAppChange(e.target.value, field.onChange);
                              }}
                              placeholder={selectedCountry.format.replace(/X/g, '0')}
                              dir="ltr"
                              className="rounded-s-none"
                            />
                          </div>
                        </FormControl>
                        <FormMessage>
                          {form.formState.errors.whatsAppNumber &&
                            t(`contactInfo.${form.formState.errors.whatsAppNumber.message}` as never)}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="facebookLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="inline-flex items-center gap-2">
                          <img
                            src={SOCIAL_ICONS.facebook}
                            alt=""
                            aria-hidden="true"
                            className="size-5 object-contain"
                          />
                          {t('contactInfo.facebook')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t('contactInfo.facebookPlaceholder')}
                            dir="ltr"
                          />
                        </FormControl>
                        <FormMessage>
                          {form.formState.errors.facebookLink &&
                            t(`contactInfo.${form.formState.errors.facebookLink.message}` as never)}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="xLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center justify-center">
                            <img
                              src={SOCIAL_ICONS.x}
                              alt=""
                              aria-hidden="true"
                              className="size-5 object-contain dark:hidden"
                            />
                            <img
                              src={SOCIAL_ICONS.xDark}
                              alt=""
                              aria-hidden="true"
                              className="hidden size-5 object-contain dark:block"
                            />
                          </span>
                          {t('contactInfo.x')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t('contactInfo.xPlaceholder')}
                            dir="ltr"
                          />
                        </FormControl>
                        <FormMessage>
                          {form.formState.errors.xLink &&
                            t(`contactInfo.${form.formState.errors.xLink.message}` as never)}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="instagramLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="inline-flex items-center gap-2">
                          <img
                            src={SOCIAL_ICONS.instagram}
                            alt=""
                            aria-hidden="true"
                            className="size-5 object-contain"
                          />
                          {t('contactInfo.instagram')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t('contactInfo.instagramPlaceholder')}
                            dir="ltr"
                          />
                        </FormControl>
                        <FormMessage>
                          {form.formState.errors.instagramLink &&
                            t(`contactInfo.${form.formState.errors.instagramLink.message}` as never)}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
                  disabled={isPending}
                >
                  {isPending && <LoaderCircle className="size-4 animate-spin" />}
                  {isPending ? t('actions.saving') : t('actions.save')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
