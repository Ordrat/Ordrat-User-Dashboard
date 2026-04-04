'use client';

import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface DatePickerProps {
  value: Date | null;
  onChange: (d: Date | null) => void;
  placeholder?: string;
  locale?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  locale: loc = 'en',
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const isArabic = loc === 'ar';
  const dateFnsLocale = isArabic ? ar : enUS;

  function handleSelect(day: Date | undefined) {
    if (!day) return;
    day.setHours(0, 0, 0, 0);
    onChange(day);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-[0.8125rem] shadow-xs shadow-black/5 transition-[color,box-shadow]',
            'h-8.5',
            'focus-visible:ring-ring/30 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            open && 'ring-ring/30 border-ring ring-[3px]',
            !value && 'text-muted-foreground/80',
            className,
          )}
        >
          <span className="truncate">
            {value
              ? format(value, 'dd MMM yyyy', { locale: dateFnsLocale })
              : placeholder}
          </span>
          <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-brand text-brand-foreground">
            <CalendarIcon className="size-3.5" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-xl"
        align="start"
        sideOffset={6}
      >
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={handleSelect}
          locale={dateFnsLocale}
        />
      </PopoverContent>
    </Popover>
  );
}
