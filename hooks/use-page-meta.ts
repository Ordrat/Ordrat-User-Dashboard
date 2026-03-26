import { useEffect } from 'react';
import { useLayout } from '@/components/layout/context';

/**
 * Sets the toolbar page title and optional logo for the current page.
 * Cleans up on unmount. Logo updates reactively when the value changes.
 *
 * Usage:
 *   usePageMeta(t('shop.profile'), logoPreview);
 *   usePageMeta(t('nav.dashboard'));
 */
export function usePageMeta(title: string, logo?: string | null) {
  const { setPageTitle, setPageLogo } = useLayout();

  useEffect(() => {
    setPageTitle(title);
    return () => {
      setPageTitle(null);
      setPageLogo(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Title updates if the translated string changes (e.g. locale switch)
  useEffect(() => {
    setPageTitle(title);
  }, [title, setPageTitle]);

  // Logo updates reactively (e.g. after image upload or data load)
  useEffect(() => {
    setPageLogo(logo ?? null);
  }, [logo, setPageLogo]);
}
