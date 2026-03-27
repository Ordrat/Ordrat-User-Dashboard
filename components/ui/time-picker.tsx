'use client';

import { useState, useCallback, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

// ─── Conversion helpers ───────────────────────────────────────────────────────

interface TimeParts {
  hour: number;   // 1–12
  minute: number; // 0–59
  period: 'AM' | 'PM';
}

function from24h(value: string | undefined): TimeParts | null {
  if (!value) return null;
  const [hStr, mStr] = value.split(':');
  const h24 = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h24) || isNaN(m)) return null;
  const period: 'AM' | 'PM' = h24 < 12 ? 'AM' : 'PM';
  const hour = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hour, minute: m, period };
}

function to24h(parts: TimeParts): string {
  let h24 = parts.hour % 12;
  if (parts.period === 'PM') h24 += 12;
  return `${String(h24).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const MINUTE_PRESETS = [0, 15, 30, 45] as const;

export function TimePicker({
  value,
  onChange,
  disabled,
  placeholder,
  className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation('common');
  const isArabic = i18n.language === 'ar';
  const locale = isArabic ? 'ar-EG' : 'en-US';
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }),
    [locale],
  );

  const parts = from24h(value);

  const periodLabels: Record<TimeParts['period'], string> = {
    AM: t('workingHours.timePicker.am'),
    PM: t('workingHours.timePicker.pm'),
  };

  const resolvedPlaceholder = placeholder ?? t('workingHours.timePicker.placeholder');

  const emit = useCallback(
    (next: TimeParts) => onChange?.(to24h(next)),
    [onChange],
  );

  const setHour = (hour: number) => {
    const base = parts ?? { hour, minute: 0, period: 'AM' };
    emit({ ...base, hour });
  };

  const setMinute = (minute: number) => {
    const base = parts ?? { hour: 12, minute, period: 'AM' };
    emit({ ...base, minute: Math.max(0, Math.min(59, minute)) });
  };

  const setPeriod = (period: 'AM' | 'PM') => {
    const base = parts ?? { hour: 12, minute: 0, period };
    emit({ ...base, period });
  };

  const formatPart = useCallback(
    (input: number) => numberFormatter.format(input),
    [numberFormatter],
  );

  const displayValue = parts
    ? `${formatPart(parts.hour)}:${formatPart(parts.minute)} ${periodLabels[parts.period]}`
    : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between gap-3 rounded-md border border-input bg-background px-3 text-[0.8125rem] shadow-xs shadow-black/5 transition-[color,box-shadow]',
            'h-8.5 text-left rtl:flex-row-reverse rtl:text-right',
            'focus-visible:ring-ring/30 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            open && 'ring-ring/30 border-ring ring-[3px]',
            !displayValue && 'text-muted-foreground/80',
            className,
          )}
        >
          <span className="truncate tabular-nums tracking-[0.14em]">
            {displayValue || resolvedPlaceholder}
          </span>
          <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-brand text-brand-foreground">
            <Clock className="size-3.5" />
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 space-y-4 rounded-2xl border border-border/80 bg-popover/95 p-4 shadow-xl backdrop-blur-sm"
        align="start"
        sideOffset={6}
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <div className="rounded-xl border border-border/70 bg-muted/35 p-3">
          <div className="flex items-start justify-between gap-3 rtl:flex-row-reverse">
            <div className="min-w-0 space-y-1 rtl:text-right">
              <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-muted-foreground">
                {t('workingHours.timePicker.selectedTime')}
              </p>
              <div className="flex items-center gap-2 rtl:flex-row-reverse">
                <span className="truncate text-lg font-semibold text-foreground tabular-nums sm:text-xl">
                  {displayValue || resolvedPlaceholder}
                </span>
                {parts ? (
                  <span className="rounded-full bg-brand px-2 py-0.5 text-[0.65rem] font-semibold text-brand-foreground">
                    {periodLabels[parts.period]}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-sm ring-1 ring-brand/20">
              <Clock className="size-4.5" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.25fr_1fr]">
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-[0.72rem] font-semibold tracking-[0.18em] text-muted-foreground">
                {t('workingHours.timePicker.hour')}
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHour(h)}
                    className={cn(
                      'h-9 w-full rounded-xl border text-sm font-semibold tabular-nums transition-all',
                      parts?.hour === h
                        ? 'border-brand bg-brand text-brand-foreground shadow-sm'
                        : 'border-border/70 bg-background text-foreground hover:border-brand/30 hover:bg-brand/8',
                    )}
                  >
                    {formatPart(h)}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-border" />

            <div>
              <div className="mb-2 flex items-center justify-between gap-2 rtl:flex-row-reverse">
                <p className="text-[0.72rem] font-semibold tracking-[0.18em] text-muted-foreground">
                  {t('workingHours.timePicker.minute')}
                </p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[0.68rem] font-medium text-muted-foreground tabular-nums">
                  {parts ? `${formatPart(parts.minute)}` : formatPart(0)}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {MINUTE_PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinute(m)}
                    className={cn(
                      'h-9 w-full rounded-xl border text-sm font-semibold tabular-nums transition-all',
                      parts?.minute === m
                        ? 'border-brand bg-brand text-brand-foreground shadow-sm'
                        : 'border-border/70 bg-background text-foreground hover:border-brand/30 hover:bg-brand/8',
                    )}
                  >
                    :{formatPart(m)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="mb-2 text-[0.72rem] font-semibold tracking-[0.18em] text-muted-foreground">
                {t('workingHours.timePicker.period')}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {(['AM', 'PM'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={cn(
                      'h-10 rounded-xl border text-sm font-semibold transition-all',
                      parts?.period === p
                        ? 'border-brand bg-brand text-brand-foreground shadow-sm'
                        : 'border-border/70 bg-background text-foreground hover:border-brand/30 hover:bg-brand/8',
                    )}
                  >
                    {periodLabels[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold tracking-[0.18em] text-muted-foreground">
                {t('workingHours.timePicker.customMinute')}
              </p>

              <Input
                type="number"
                min={0}
                max={59}
                inputMode="numeric"
                dir="ltr"
                placeholder={isArabic ? '٠٠ - ٥٩' : '00 - 59'}
                value={parts?.minute ?? ''}
                className="text-center font-semibold tabular-nums"
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v)) setMinute(v);
                }}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
