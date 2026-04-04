'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpRight,
  Copy,
  Eraser,
  Palette,
  QrCode,
  ScanLine,
  Sparkles,
  Undo2,
  LoaderCircle,
} from 'lucide-react';
import QRCodeStyling, { type Options as QROptions } from 'qr-code-styling';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePageMeta } from '@/hooks/use-page-meta';
import { useShopProfile } from '@/lib/ordrat-api/shop';
import { cn } from '@/lib/utils';

type QRStyle = 'classic' | 'rounded' | 'logo';

type ColorPreset = {
  key: string;
  fg: string;
};

type QRDesignState = {
  selectedStyle: QRStyle;
  fgColor: string;
  margin: number;
  logoScale: number;
  roundness: number;
};

const COLOR_PRESETS: ColorPreset[] = [
  { key: 'brand', fg: '#991b1b' },
  { key: 'midnight', fg: '#0f172a' },
  { key: 'forest', fg: '#166534' },
  { key: 'gold', fg: '#92400e' },
];

const DEFAULT_STYLE: QRStyle = 'rounded';
const DEFAULT_FOREGROUND = '#991b1b';
const DEFAULT_MARGIN = 14;
const DEFAULT_LOGO_SCALE = 0.26;
const DEFAULT_ROUNDNESS = 2;

const ROUNDNESS_STYLES = [
  { dots: 'rounded', cornersSquare: 'square', cornersDot: 'square' },
  { dots: 'rounded', cornersSquare: 'extra-rounded', cornersDot: 'dot' },
  { dots: 'extra-rounded', cornersSquare: 'extra-rounded', cornersDot: 'dot' },
  { dots: 'classy-rounded', cornersSquare: 'extra-rounded', cornersDot: 'dot' },
] as const;

export default function QRCodePage() {
  const { t } = useTranslation('common');
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';

  usePageMeta(t('qrCode.title'));

  const { data: shop, isLoading } = useShopProfile();
  const subdomain = shop?.subdomainName;
  const shopUrl = subdomain ? `https://${subdomain}.ordrat.com` : null;
  const logoUrl = shop?.logoUrl ?? null;

  const [selectedStyle, setSelectedStyle] = useState<QRStyle>(DEFAULT_STYLE);
  const [fgColor, setFgColor] = useState(DEFAULT_FOREGROUND);
  const [margin, setMargin] = useState(DEFAULT_MARGIN);
  const [logoScale, setLogoScale] = useState(DEFAULT_LOGO_SCALE);
  const [roundness, setRoundness] = useState(DEFAULT_ROUNDNESS);
  const [previousDesign, setPreviousDesign] = useState<QRDesignState | null>(null);

  const qrRef = useRef<HTMLDivElement>(null);
  const qrInstance = useRef<QRCodeStyling | null>(null);

  const currentDesign: QRDesignState = {
    selectedStyle,
    fgColor,
    margin,
    logoScale,
    roundness,
  };

  function applyDesign(nextDesign: QRDesignState) {
    setPreviousDesign(currentDesign);
    setSelectedStyle(nextDesign.selectedStyle);
    setFgColor(nextDesign.fgColor);
    setMargin(nextDesign.margin);
    setLogoScale(nextDesign.logoScale);
    setRoundness(nextDesign.roundness);
  }

  function buildQROptions(): QROptions {
    const roundedStyle = ROUNDNESS_STYLES[roundness] ?? ROUNDNESS_STYLES[DEFAULT_ROUNDNESS];
    const base: QROptions = {
      width: 288,
      height: 288,
      data: shopUrl ?? 'https://ordrat.com',
      margin,
      qrOptions: { errorCorrectionLevel: selectedStyle === 'logo' ? 'H' : 'M' },
      dotsOptions: { color: fgColor, type: 'square' },
      cornersSquareOptions: { color: fgColor, type: 'square' },
      cornersDotOptions: { color: fgColor },
      backgroundOptions: { color: 'transparent' },
    };

    if (selectedStyle === 'classic') {
      return base;
    }

    if (selectedStyle === 'rounded') {
      return {
        ...base,
        dotsOptions: { color: fgColor, type: roundedStyle.dots },
        cornersSquareOptions: { color: fgColor, type: roundedStyle.cornersSquare },
        cornersDotOptions: { color: fgColor, type: roundedStyle.cornersDot },
      };
    }

    return {
      ...base,
      dotsOptions: { color: fgColor, type: roundedStyle.dots },
      cornersSquareOptions: { color: fgColor, type: roundedStyle.cornersSquare },
      cornersDotOptions: { color: fgColor, type: roundedStyle.cornersDot },
      image: logoUrl ?? undefined,
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 6,
        imageSize: logoScale,
      },
    };
  }

  useEffect(() => {
    if (!qrRef.current || !shopUrl) return;

    const options = buildQROptions();

    qrRef.current.innerHTML = '';
    qrInstance.current = new QRCodeStyling(options);
    qrInstance.current.append(qrRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopUrl, selectedStyle, fgColor, margin, logoScale, logoUrl, roundness]);

  function resetDesign() {
    applyDesign({
      selectedStyle: DEFAULT_STYLE,
      fgColor: DEFAULT_FOREGROUND,
      margin: DEFAULT_MARGIN,
      logoScale: DEFAULT_LOGO_SCALE,
      roundness: DEFAULT_ROUNDNESS,
    });
  }

  function undoDesign() {
    if (!previousDesign) return;

    const snapshot = currentDesign;
    setSelectedStyle(previousDesign.selectedStyle);
    setFgColor(previousDesign.fgColor);
    setMargin(previousDesign.margin);
    setLogoScale(previousDesign.logoScale);
    setRoundness(previousDesign.roundness);
    setPreviousDesign(snapshot);
  }

  async function copyDomain() {
    if (!shopUrl || !navigator.clipboard) {
      toast.error(t('qrCode.copyError'));
      return;
    }

    try {
      await navigator.clipboard.writeText(shopUrl);
      toast.success(t('qrCode.copySuccess'));
    } catch {
      toast.error(t('qrCode.copyError'));
    }
  }

  function downloadPng() {
    qrInstance.current?.download({ extension: 'png', name: 'shop-qr' });
  }

  function downloadSvg() {
    qrInstance.current?.download({ extension: 'svg', name: 'shop-qr' });
  }

  function applyPreset(preset: ColorPreset) {
    applyDesign({
      ...currentDesign,
      fgColor: preset.fg,
    });
  }

  if (isLoading) {
    return (
      <div className="p-10 flex justify-center">
        <LoaderCircle className="size-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!subdomain) {
    return (
      <div className="p-6">
        <Card className="overflow-hidden border-border/70 bg-card shadow-sm shadow-black/5">
          <CardContent className="bg-linear-to-br from-brand/6 via-background to-muted/50 p-6 md:p-7">
            <Alert>
              <AlertDescription className="space-y-3">
                <p className="text-sm leading-6">{t('qrCode.noDomain')}</p>
                <Button asChild variant="outline">
                  <Link href={`/${locale}/store-settings/basic-data`}>
                    {t('qrCode.noDomainLink')}
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card p-6 shadow-sm shadow-black/5 md:p-7">
        <Badge className="absolute top-6 inset-e-6 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background px-3 py-1 text-[0.72rem] font-medium text-foreground shadow-xs shadow-black/10 hover:bg-background">
          <span className="relative flex size-2.5">
            <span className="absolute inset-0 rounded-full bg-emerald-500/70 animate-ping" />
            <span className="relative rounded-full bg-emerald-600 size-2.5" />
          </span>
          {t('qrCode.metricReady')}
        </Badge>
        <div className="space-y-5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t('qrCode.heroTitle')}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-[0.95rem]">
            {t('qrCode.heroDescription')}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-2 shadow-xs shadow-black/5 backdrop-blur">
              <QrCode className="size-4 text-brand" />
              <span className="font-mono text-xs text-foreground md:text-sm">{shopUrl}</span>
            </div>
            <Button variant="outline" size="sm" onClick={copyDomain}>
              <Copy className="size-4" />
              {t('qrCode.copyLink')}
            </Button>
            <Button asChild size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <a href={shopUrl ?? undefined} target="_blank" rel="noreferrer">
                <ArrowUpRight className="size-4" />
                {t('qrCode.openStore')}
              </a>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm shadow-black/5">
            <CardHeader className="space-y-3 px-6 pt-6 md:px-7 md:pt-7">
              <div className="flex flex-col gap-5">
                <div className="space-y-3">
                  <CardTitle>{t('qrCode.controlsTitle')}</CardTitle>
                  <CardDescription>{t('qrCode.controlsDescription')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6 md:px-7 md:pb-7">
              <Tabs defaultValue="design" className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 rounded-full bg-muted/50 p-1.5">
                  <TabsList variant="button" shape="pill" className="flex-wrap bg-transparent p-0">
                    <TabsTrigger
                      value="design"
                      className="hover:bg-slate-200 hover:text-foreground focus-visible:ring-brand/25 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground data-[state=active]:shadow-none [&:hover_svg]:text-foreground [&[data-state=active]_svg]:text-brand-foreground"
                    >
                      <Sparkles className="size-4" />
                      {t('qrCode.tabDesign')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="colors"
                      className="hover:bg-slate-200 hover:text-foreground focus-visible:ring-brand/25 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground data-[state=active]:shadow-none [&:hover_svg]:text-foreground [&[data-state=active]_svg]:text-brand-foreground"
                    >
                      <Palette className="size-4" />
                      {t('qrCode.tabColors')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="refine"
                      className="hover:bg-slate-200 hover:text-foreground focus-visible:ring-brand/25 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground data-[state=active]:shadow-none [&:hover_svg]:text-foreground [&[data-state=active]_svg]:text-brand-foreground"
                    >
                      <ScanLine className="size-4" />
                      {t('qrCode.tabRefine')}
                    </TabsTrigger>
                  </TabsList>
                  <div className="ms-auto flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={-1} className="inline-flex">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            mode="icon"
                            onClick={undoDesign}
                            disabled={!previousDesign}
                            aria-label={t('qrCode.undoDesign')}
                            className="rounded-full"
                          >
                            <Undo2 className="size-4" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {t('qrCode.undoDesign')}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          mode="icon"
                          onClick={resetDesign}
                          aria-label={t('qrCode.clearDesign')}
                          className="cursor-pointer rounded-full border-brand/20 text-brand hover:border-brand/35 hover:bg-brand/10 hover:text-brand"
                        >
                          <Eraser className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {t('qrCode.clearDesign')}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <TabsContent value="design" className="space-y-6 pt-1">
                  <div className="grid gap-4 md:grid-cols-3">
                    {(['classic', 'rounded', 'logo'] as QRStyle[]).map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => applyDesign({ ...currentDesign, selectedStyle: style })}
                        className={cn(
                          'rounded-2xl border p-4 text-left transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/20 focus-visible:ring-offset-2',
                          selectedStyle === style
                            ? 'border-brand/20 bg-muted shadow-sm shadow-brand/8'
                            : 'border-border/70 bg-muted/35 hover:border-brand/10 hover:bg-accent',
                        )}
                      >
                        <span
                          className={cn(
                            'text-sm font-medium leading-4',
                            selectedStyle === style
                              ? 'text-brand'
                              : 'text-foreground',
                          )}
                        >
                          {t(`qrCode.style${style.charAt(0).toUpperCase() + style.slice(1)}` as never)}
                        </span>
                      </button>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-5">
                    <SettingRow
                      label={t('qrCode.padding')}
                      value={`${margin}px`}
                      helper={t('qrCode.paddingHelp')}
                    >
                      <Slider
                        value={[margin]}
                        min={0}
                        max={24}
                        step={2}
                        onValueChange={(value) =>
                          applyDesign({
                            ...currentDesign,
                            margin: value[0] ?? DEFAULT_MARGIN,
                          })}
                      >
                        <SliderThumb />
                      </Slider>
                    </SettingRow>
                  </div>
                </TabsContent>

                <TabsContent value="colors" className="space-y-6 pt-1">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="rounded-2xl border border-border/70 bg-card p-3 text-left transition-colors hover:border-brand/40 hover:bg-muted/30"
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <span className="size-5 rounded-full border border-black/10" style={{ backgroundColor: preset.fg }} />
                        </div>
                        <p className="text-sm font-medium text-foreground">{t(`qrCode.preset${preset.key.charAt(0).toUpperCase() + preset.key.slice(1)}` as never)}</p>
                      </button>
                    ))}
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:max-w-sm">
                    <ColorField
                      id="qr-foreground"
                      label={t('qrCode.fgColor')}
                      value={fgColor}
                      onChange={(value) =>
                        applyDesign({
                          ...currentDesign,
                          fgColor: value,
                        })}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="refine" className="space-y-6 pt-1">
                  <div className="space-y-5">
                    <SettingRow
                      label={t('qrCode.cornerSoftness')}
                      value={`${Math.round((roundness / (ROUNDNESS_STYLES.length - 1)) * 100)}%`}
                      helper={t('qrCode.cornerSoftnessHelp')}
                    >
                      <Slider
                        value={[roundness]}
                        min={0}
                        max={ROUNDNESS_STYLES.length - 1}
                        step={1}
                        disabled={selectedStyle === 'classic'}
                        onValueChange={(value) =>
                          applyDesign({
                            ...currentDesign,
                            roundness: value[0] ?? DEFAULT_ROUNDNESS,
                          })}
                      >
                        <SliderThumb />
                      </Slider>
                    </SettingRow>

                    {selectedStyle === 'logo' ? (
                      <SettingRow
                        label={t('qrCode.logoScale')}
                        value={`${Math.round(logoScale * 100)}%`}
                        helper={logoUrl ? t('qrCode.logoScaleHelp') : t('qrCode.logoMissing')}
                      >
                        <Slider
                          value={[logoScale]}
                          min={0.18}
                          max={0.35}
                          step={0.01}
                          disabled={!logoUrl}
                          onValueChange={(value) =>
                            applyDesign({
                              ...currentDesign,
                              logoScale: value[0] ?? DEFAULT_LOGO_SCALE,
                            })}
                        >
                          <SliderThumb />
                        </Slider>
                      </SettingRow>
                    ) : null}

                    <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
                      <p className="text-sm font-medium text-foreground">{t('qrCode.scanTipsTitle')}</p>
                      <div className="space-y-2 text-sm leading-6 text-muted-foreground">
                        <p>{t('qrCode.scanTipContrast')}</p>
                        <p>{t('qrCode.scanTipPadding')}</p>
                        <p>{t('qrCode.scanTipLogo')}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden border-border/70 shadow-sm shadow-black/5">
            <CardHeader className="space-y-3 border-b border-border/70 bg-muted/20 px-6 pt-6 md:px-7 md:pt-7">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-3">
                  <CardTitle>{t('qrCode.preview')}</CardTitle>
                  <CardDescription>{t('qrCode.previewDescription')}</CardDescription>
                </div>
                <Badge className="ml-4 h-auto max-w-34 shrink-0 self-start whitespace-normal bg-brand px-2.5 py-1.5 text-left leading-4 text-brand-foreground hover:bg-brand md:ml-6">
                  {t(`qrCode.style${selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)}` as never)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6 pt-6 md:px-7 md:pb-7">
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t('qrCode.domain')}</p>
                    <p className="font-mono text-sm leading-6 text-foreground">{shopUrl}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center overflow-hidden rounded-4xl border border-border/60 bg-muted/35 p-6 shadow-inner shadow-black/5 sm:p-8 md:p-10">
                  <div ref={qrRef} className="[&_canvas]:h-auto [&_canvas]:max-w-full [&_svg]:h-auto [&_svg]:max-w-full" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <ExportTypeButton
                  label="PNG"
                  onClick={downloadPng}
                />
                <ExportTypeButton
                  label="SVG"
                  onClick={downloadSvg}
                />
                <ExportTypeButton
                  label="PDF"
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ExportTypeButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="h-11 rounded-2xl bg-card px-3 text-sm font-medium"
    >
      {label}
    </Button>
  );
}

function SettingRow({
  label,
  value,
  helper,
  children,
}: {
  label: string;
  value: string;
  helper: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
        <Badge variant="outline" className="rounded-full px-3 py-1 font-mono text-xs">
          {value}
        </Badge>
      </div>
      {children}
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        <div className="size-5 rounded-full border border-black/10" style={{ backgroundColor: value }} />
      </div>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
        />
        <Input value={value} onChange={(event) => onChange(event.target.value)} dir="ltr" className="font-mono uppercase" />
      </div>
    </div>
  );
}
