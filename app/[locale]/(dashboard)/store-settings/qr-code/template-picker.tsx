'use client';

import { Download, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { QR_TEMPLATES } from '@/lib/qr-templates/config';
import { cn } from '@/lib/utils';

type Props = {
  selectedId: 1 | 2 | 3 | 4;
  onSelect: (id: 1 | 2 | 3 | 4) => void;
  onDownload?: (id: 1 | 2 | 3 | 4) => void;
  downloadingId?: 1 | 2 | 3 | 4 | null;
  disabled?: boolean;
  disabledTooltip?: string;
};

export function TemplatePicker({
  selectedId,
  onSelect,
  onDownload,
  downloadingId = null,
  disabled = false,
  disabledTooltip,
}: Props) {
  const { t } = useTranslation('common');
  const isAnyDownloading = downloadingId !== null;

  return (
    <div className="grid grid-cols-4 gap-2">
      {QR_TEMPLATES.map((template) => {
        const isSelected = selectedId === template.id;
        const isThisDownloading = downloadingId === template.id;

        return (
          <Tooltip key={template.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                tabIndex={disabled ? -1 : 0}
                aria-pressed={isSelected}
                aria-label={t(template.labelKey as never)}
                onClick={() => !disabled && onSelect(template.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!disabled) onSelect(template.id);
                  }
                }}
                className={cn(
                  'group relative overflow-hidden rounded-xl border-2 transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-2',
                  disabled && 'pointer-events-none opacity-50',
                  isSelected
                    ? 'border-foreground bg-card shadow-sm'
                    : 'border-transparent bg-card hover:border-foreground/20',
                )}
              >
                <img
                  src={template.thumbnailUrl}
                  alt={t(template.labelKey as never)}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
                
                {/* Download overlay on hover */}
                {onDownload && (
                  <div
                    className={cn(
                      'absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity',
                      isThisDownloading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                    )}
                  >
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAnyDownloading) onDownload(template.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          if (!isAnyDownloading) onDownload(template.id);
                        }
                      }}
                      className={cn(
                        'flex items-center justify-center size-7 rounded-full bg-white/90 text-foreground shadow-md hover:bg-white transition-colors',
                        isAnyDownloading && 'opacity-60 pointer-events-none',
                      )}
                      aria-label={t('qrCode.downloadTemplate')}
                    >
                      {isThisDownloading ? (
                        <LoaderCircle className="size-3.5 animate-spin" />
                      ) : (
                        <Download className="size-3.5" />
                      )}
                    </span>
                  </div>
                )}
              </button>
            </TooltipTrigger>

            <TooltipContent>
              {disabled && disabledTooltip ? disabledTooltip : t(template.labelKey as never)}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
