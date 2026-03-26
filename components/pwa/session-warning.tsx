'use client';

import { useEffect, useState } from 'react';
import { getSession, useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { ShieldAlert } from 'lucide-react';

export function SessionWarning() {
  const { data: session } = useSession();
  const { isOffline } = useOnlineStatus();
  const { t } = useTranslation('common');
  const [showWarning, setShowWarning] = useState(false);

  // Determine if the session has expired
  const isExpired = session?.expires ? new Date(session.expires) < new Date() : false;

  useEffect(() => {
    if (isOffline && isExpired) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [isOffline, isExpired]);

  // When we come back online, silently attempt token refresh
  useEffect(() => {
    if (!isOffline && showWarning) {
      getSession().then((refreshed) => {
        if (refreshed && new Date(refreshed.expires) > new Date()) {
          setShowWarning(false);
        }
      });
    }
  }, [isOffline, showWarning]);

  if (!showWarning) return null;

  return (
    <Alert variant="warning" appearance="light" size="sm" className="rounded-none w-full">
      <AlertIcon>
        <ShieldAlert />
      </AlertIcon>
      <AlertTitle>{t('pwa.session_expired_warning')}</AlertTitle>
    </Alert>
  );
}
