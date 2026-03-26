'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSwLifecycle } from '@/hooks/use-sw-lifecycle';

export function SWUpdatePrompt() {
  const { hasUpdate, applyUpdate } = useSwLifecycle();
  const { t } = useTranslation('common');

  useEffect(() => {
    if (!hasUpdate) return;

    toast(t('pwa.update_available'), {
      duration: Infinity,
      action: {
        label: t('pwa.update_reload'),
        onClick: applyUpdate,
      },
    });
  }, [hasUpdate, applyUpdate, t]);

  return null;
}
