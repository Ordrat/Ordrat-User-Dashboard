'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { LoaderCircle, Upload, ImagePlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

import { useCreateShop, useCurrencies, useThemes, checkSubdomain } from '@/lib/ordrat-api/shop';
import { ShopLanguage, ShopType } from '@/lib/ordrat-api/schemas';

const createShopSchema = z.object({
  nameEn: z.string().min(1, 'Required'),
  nameAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  subdomain: z.string().min(1, 'Required'),
  shopLanguage: z.string(),
  shopType: z.string(),
  phoneNumber: z.string().min(1, 'Required'),
  addressText: z.string().optional(),
  currencyId: z.string().min(1, 'Required'),
  themeId: z.string().optional(),
  deliveryTime: z.string().optional(),
  mainColor: z.string().optional(),
  secondaryColor: z.string().optional(),
});

type CreateShopValues = z.infer<typeof createShopSchema>;

export function CreateShopForm() {
  const { t } = useTranslation('common');
  const { update } = useSession();
  const router = useRouter();
  const createShop = useCreateShop();
  const { data: currencies = [], isLoading: loadingCurrencies } = useCurrencies();
  const { data: themes = [], isLoading: loadingThemes } = useThemes();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateShopValues>({
    resolver: zodResolver(createShopSchema),
    defaultValues: {
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      subdomain: '',
      shopLanguage: String(ShopLanguage.ArabicandEnglish),
      shopType: String(ShopType.Shop),
      phoneNumber: '',
      addressText: '',
      currencyId: '',
      themeId: '',
      deliveryTime: '30',
      mainColor: '#000000',
      secondaryColor: '#ffffff',
    },
  });

  const subdomainValue = form.watch('subdomain') ?? '';
  const shopLanguageValue = Number(form.watch('shopLanguage'));

  useEffect(() => {
    const slug = subdomainValue.trim();
    if (!slug) { setSubdomainStatus('idle'); return; }
    setSubdomainStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const result = await checkSubdomain(slug);
        setSubdomainStatus(result === 'available' ? 'available' : 'taken');
      } catch {
        setSubdomainStatus('idle');
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [subdomainValue]);
  const showArabic = shopLanguageValue === ShopLanguage.Arabic || shopLanguageValue === ShopLanguage.ArabicandEnglish;
  const showEnglish = shopLanguageValue === ShopLanguage.English || shopLanguageValue === ShopLanguage.ArabicandEnglish;

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: CreateShopValues) {
    const formData = new FormData();
    formData.append('NameEn', values.nameEn);
    if (values.nameAr) formData.append('NameAr', values.nameAr);
    if (values.descriptionEn) formData.append('DescriptionEn', values.descriptionEn);
    if (values.descriptionAr) formData.append('DescriptionAr', values.descriptionAr);
    formData.append('SubdomainName', values.subdomain);
    formData.append('Languages', values.shopLanguage);
    formData.append('ShopType', values.shopType);
    formData.append('PhoneNumber', values.phoneNumber);
    if (values.addressText) formData.append('AddressText', values.addressText);
    formData.append('CurrencyId', values.currencyId);
    if (values.themeId) formData.append('ThemeId', values.themeId);
    if (values.deliveryTime) formData.append('DeliveryTime', values.deliveryTime);
    if (values.mainColor) formData.append('MainColor', values.mainColor);
    if (values.secondaryColor) formData.append('SecondaryColor', values.secondaryColor);
    formData.append('CoverageRadius', '500');
    formData.append('OpenAt', '09:00:00');
    formData.append('ClosedAt', '22:00:00');
    if (logoFile) formData.append('Logo', logoFile);
    if (coverFile) formData.append('Background', coverFile);

    try {
      await createShop.mutateAsync({ currencyId: values.currencyId, body: formData });
      toast.success(t('shop.createSuccess'));
      // Refresh the NextAuth session server-side — picks up the new shopId JWT claim
      await update();
      router.refresh();
    } catch {
      toast.error(t('shop.createError'));
    }
  }


  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Images */}
          <Card>
            <CardHeader><CardTitle className="text-base">{t('shop.images')}</CardTitle></CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-10">
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('shop.logo')}</p>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => logoInputRef.current?.click()}
                    className="relative h-24 w-24 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted hover:border-primary/50 transition-colors overflow-hidden flex items-center justify-center group">
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImagePlus className="h-6 w-6 text-white" />
                        </div>
                      </>
                    ) : <Upload className="h-6 w-6 text-muted-foreground" />}
                  </button>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{t('shop.uploadLogoHint')}</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>{t('shop.uploadLogo')}</Button>
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('shop.coverImage')}</p>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => coverInputRef.current?.click()}
                    className="relative h-24 w-56 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted hover:border-primary/50 transition-colors overflow-hidden flex items-center justify-center group">
                    {coverPreview ? (
                      <>
                        <img src={coverPreview} alt="Cover" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImagePlus className="h-6 w-6 text-white" />
                        </div>
                      </>
                    ) : <Upload className="h-6 w-6 text-muted-foreground" />}
                  </button>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{t('shop.uploadCoverHint')}</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => coverInputRef.current?.click()}>{t('shop.uploadCover')}</Button>
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">{t('shop.basicInfo')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">

              <FormField control={form.control} name="shopLanguage" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('shop.shopLanguage')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={String(ShopLanguage.Arabic)}>{t('shop.shopLanguageArabic')}</SelectItem>
                      <SelectItem value={String(ShopLanguage.English)}>{t('shop.shopLanguageEnglish')}</SelectItem>
                      <SelectItem value={String(ShopLanguage.ArabicandEnglish)}>{t('shop.shopLanguageBoth')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="shopType" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('shop.shopType')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={String(ShopType.Shop)}>{t('shop.shopTypeShop')}</SelectItem>
                      <SelectItem value={String(ShopType.SuperMarket)}>{t('shop.shopTypeSupermarket')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {showEnglish && (
                  <FormField control={form.control} name="nameEn" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shop.nameEn')}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                {showArabic && (
                  <FormField control={form.control} name="nameAr" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shop.nameAr')}</FormLabel>
                      <FormControl><Input {...field} dir="rtl" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>

              {showEnglish && (
                <FormField control={form.control} name="descriptionEn" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('shop.descriptionEn')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              {showArabic && (
                <FormField control={form.control} name="descriptionAr" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('shop.descriptionAr')}</FormLabel>
                    <FormControl><Input {...field} dir="rtl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <FormField control={form.control} name="subdomain" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('shop.subdomain')}</FormLabel>
                  <FormControl>
                    <div className="flex items-center rounded-md border focus-within:ring-1 focus-within:ring-ring overflow-hidden">
                      <Input {...field} className="border-0 shadow-none focus-visible:ring-0 rounded-none" />
                      {subdomainStatus === 'checking' && (
                        <span className="px-3 flex items-center">
                          <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                        </span>
                      )}
                      {subdomainStatus === 'available' && (
                        <span className="px-2 flex items-center">
                          <CheckCircle2 className="size-4 text-green-500" />
                        </span>
                      )}
                      {subdomainStatus === 'taken' && (
                        <span className="px-2 flex items-center">
                          <AlertCircle className="size-4 text-amber-500" />
                        </span>
                      )}
                      <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-l select-none whitespace-nowrap">.ordrat.com</span>
                    </div>
                  </FormControl>
                  {subdomainStatus === 'available' && (
                    <p className="text-xs text-green-600">{t('shop.subdomainAvailable')}</p>
                  )}
                  {subdomainStatus === 'taken' && (
                    <p className="text-xs text-amber-600">{t('shop.subdomainUnavailable')}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('shop.phone')}</FormLabel>
                    <FormControl><Input {...field} type="tel" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="addressText" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('shop.address')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="currencyId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('shop.currency')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={loadingCurrencies}>
                      <FormControl><SelectTrigger><SelectValue placeholder={loadingCurrencies ? '…' : t('shop.selectCurrency')} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name} ({c.abbreviation})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="themeId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('shop.theme')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={loadingThemes}>
                      <FormControl><SelectTrigger><SelectValue placeholder={loadingThemes ? '…' : t('shop.selectTheme')} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {themes.map((th) => (
                          <SelectItem key={th.id} value={th.id}>{th.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader><CardTitle className="text-base">{t('shop.branding')}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="mainColor" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('shop.mainColor')}</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <input type="color"
                          value={/^#[0-9a-f]{6}$/i.test(field.value ?? '') ? field.value : '#000000'}
                          onChange={field.onChange}
                          className="h-9 w-12 cursor-pointer rounded border border-input bg-background px-0.5 py-0.5" />
                        <Input value={field.value} onChange={field.onChange} className="font-mono uppercase" maxLength={7} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="secondaryColor" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('shop.secondaryColor')}</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <input type="color"
                          value={/^#[0-9a-f]{6}$/i.test(field.value ?? '') ? field.value : '#ffffff'}
                          onChange={field.onChange}
                          className="h-9 w-12 cursor-pointer rounded border border-input bg-background px-0.5 py-0.5" />
                        <Input value={field.value} onChange={field.onChange} className="font-mono uppercase" maxLength={7} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={createShop.isPending} className="bg-brand hover:bg-brand/90 text-brand-foreground">
              {createShop.isPending && <LoaderCircle className="mr-2 size-4 animate-spin" />}
              {t('shop.createShop')}
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}
