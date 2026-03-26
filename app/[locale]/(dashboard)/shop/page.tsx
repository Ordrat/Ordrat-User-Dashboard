'use client';

import { useEffect, useRef, useState } from 'react';
import { usePageMeta } from '@/hooks/use-page-meta';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { LoaderCircle, Upload, TriangleAlert, ImagePlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

import { useShopProfile, useUpdateShop, checkSubdomain } from '@/lib/ordrat-api/shop';
import { ShopLanguage } from '@/lib/ordrat-api/schemas';
import { CreateShopForm } from './create-shop-form';

// Fields accepted by PUT /api/Shop/Update (multipart/form-data)
const shopProfileSchema = z.object({
  shopLanguage: z.string(),
  nameEn: z.string().optional(),
  nameAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  subdomain: z.string().optional(),
  mainColor: z.string().optional(),
  secondaryColor: z.string().optional(),
});

type ShopProfileValues = z.infer<typeof shopProfileSchema>;

export default function ShopProfilePage() {
  const { t } = useTranslation('common');

  const { data: shop, isLoading, isError, refetch } = useShopProfile();
  const updateShop = useUpdateShop();

  // File state — logo = "Logo" field, cover = "Background" field in the API
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Subdomain availability
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const originalSubdomain = (shop?.subdomainName ?? '').replace(/\.ordrat\.com$/i, '');

  usePageMeta(t('shop.profile'), logoPreview);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ShopProfileValues>({
    resolver: zodResolver(shopProfileSchema),
    defaultValues: {
      shopLanguage: String(ShopLanguage.ArabicandEnglish),
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      subdomain: '',
      mainColor: '#000000',
      secondaryColor: '#000000',
    },
  });

  useEffect(() => {
    if (shop) {
      form.reset({
        shopLanguage: String(shop.languages),
        nameEn: shop.nameEn ?? '',
        nameAr: shop.nameAr ?? '',
        descriptionEn: shop.descriptionEn ?? '',
        descriptionAr: shop.descriptionAr ?? '',
        subdomain: (shop.subdomainName ?? '').replace(/\.ordrat\.com$/i, ''),
        mainColor: shop.mainColor ?? '#000000',
        secondaryColor: shop.secondaryColor ?? '#000000',
      });
      setLogoPreview(shop.logoUrl ?? null);
      setCoverPreview(shop.backgroundUrl ?? null);
    }
  }, [shop, form]);

  const subdomainValue = form.watch('subdomain') ?? '';

  // Debounced subdomain availability check — skip if unchanged from saved value
  useEffect(() => {
    const slug = subdomainValue.trim();
    if (!slug || slug === originalSubdomain) {
      setSubdomainStatus('idle');
      return;
    }
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
  }, [subdomainValue, originalSubdomain]);

  const shopLanguageValue = Number(form.watch('shopLanguage'));
  const showBilingual = shopLanguageValue === ShopLanguage.ArabicandEnglish;
  const showArabic =
    shopLanguageValue === ShopLanguage.Arabic ||
    shopLanguageValue === ShopLanguage.ArabicandEnglish;
  const showEnglish =
    shopLanguageValue === ShopLanguage.English ||
    shopLanguageValue === ShopLanguage.ArabicandEnglish;

  const canSave = form.formState.isDirty || !!logoFile || !!coverFile;

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

  async function onSubmit(values: ShopProfileValues) {
    const formData = new FormData();
    formData.append('Languages', values.shopLanguage);
    if (values.nameEn) formData.append('NameEn', values.nameEn);
    if (values.nameAr) formData.append('NameAr', values.nameAr);
    if (values.descriptionEn) formData.append('DescriptionEn', values.descriptionEn);
    if (values.descriptionAr) formData.append('DescriptionAr', values.descriptionAr);
    if (values.subdomain) formData.append('SubdomainName', values.subdomain);
    if (values.mainColor) formData.append('MainColor', values.mainColor);
    if (values.secondaryColor) formData.append('SecondaryColor', values.secondaryColor);
    // Logo and Background are binary fields inside the same Update request
    if (logoFile) formData.append('Logo', logoFile);
    if (coverFile) formData.append('Background', coverFile);

    try {
      await updateShop.mutateAsync(formData);
      setLogoFile(null);
      setCoverFile(null);
      toast.success(t('shop.saveSuccess'));
    } catch {
      toast.error(t('shop.saveError'));
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <Alert variant="destructive" appearance="light">
          <AlertIcon><TriangleAlert /></AlertIcon>
          <AlertTitle>{t('shop.loadError')}</AlertTitle>
        </Alert>
        <Button className="mt-4" onClick={() => refetch()}>{t('actions.retry')}</Button>
      </div>
    );
  }

  // No shop linked — show create form for first-time setup
  if (!isLoading && !shop) {
    return <CreateShopForm />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* ── Images ─────────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('shop.images')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-10">

              {/* Logo — "Logo" field */}
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('shop.logo')}</p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="relative h-24 w-24 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted hover:border-primary/50 hover:bg-muted/80 transition-colors overflow-hidden flex items-center justify-center group"
                  >
                    {logoPreview ? (
                      <>
                        <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImagePlus className="h-6 w-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{t('shop.uploadLogoHint')}</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                      {t('shop.uploadLogo')}
                    </Button>
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </div>
              </div>

              {/* Cover — "Background" field in the API */}
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('shop.coverImage')}</p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="relative h-24 w-56 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted hover:border-primary/50 hover:bg-muted/80 transition-colors overflow-hidden flex items-center justify-center group"
                  >
                    {coverPreview ? (
                      <>
                        <img src={coverPreview} alt="Cover" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImagePlus className="h-6 w-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{t('shop.uploadCoverHint')}</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => coverInputRef.current?.click()}>
                      {t('shop.uploadCover')}
                    </Button>
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                </div>
              </div>

            </CardContent>
          </Card>

          {/* ── Basic Info ──────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('shop.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <FormField
                control={form.control}
                name="shopLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('shop.shopLanguage')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={String(ShopLanguage.Arabic)}>{t('shop.shopLanguageArabic')}</SelectItem>
                        <SelectItem value={String(ShopLanguage.English)}>{t('shop.shopLanguageEnglish')}</SelectItem>
                        <SelectItem value={String(ShopLanguage.ArabicandEnglish)}>{t('shop.shopLanguageBoth')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className={showBilingual ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : undefined}>
                {showEnglish && (
                  <FormField
                    control={form.control}
                    name="nameEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('shop.nameEn')}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
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
                        <FormLabel>{t('shop.nameAr')}</FormLabel>
                        <FormControl><Input {...field} dir="rtl" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {showEnglish && (
                <FormField
                  control={form.control}
                  name="descriptionEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shop.descriptionEn')}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {showArabic && (
                <FormField
                  control={form.control}
                  name="descriptionAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shop.descriptionAr')}</FormLabel>
                      <FormControl><Input {...field} dir="rtl" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="subdomain"
                render={({ field }) => (
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
                        <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-l select-none whitespace-nowrap">
                          .ordrat.com
                        </span>
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
                )}
              />

            </CardContent>
          </Card>

          {/* ── Branding ────────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('shop.branding')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="mainColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shop.mainColor')}</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={/^#[0-9a-f]{6}$/i.test(field.value ?? '') ? field.value : '#000000'}
                            onChange={field.onChange}
                            className="h-9 w-12 cursor-pointer rounded border border-input bg-background px-0.5 py-0.5"
                          />
                          <Input
                            value={field.value}
                            onChange={field.onChange}
                            className="font-mono uppercase"
                            maxLength={7}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('shop.secondaryColor')}</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={/^#[0-9a-f]{6}$/i.test(field.value ?? '') ? field.value : '#000000'}
                            onChange={field.onChange}
                            className="h-9 w-12 cursor-pointer rounded border border-input bg-background px-0.5 py-0.5"
                          />
                          <Input
                            value={field.value}
                            onChange={field.onChange}
                            className="font-mono uppercase"
                            maxLength={7}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateShop.isPending || !canSave}>
              {updateShop.isPending && <LoaderCircle className="size-4 animate-spin" />}
              {t('actions.save')}
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}
