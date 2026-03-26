'use client';
import { useParams } from 'next/navigation';

export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function useLocale(): Locale {
  const params = useParams();
  const locale = params?.locale as string;
  return LOCALES.includes(locale as Locale) ? (locale as Locale) : DEFAULT_LOCALE;
}

export function localePath(locale: string, path: string): string {
  return `/${locale}${path.startsWith('/') ? path : '/' + path}`;
}

export function getLocalePath(locale: string, pathname: string): string {
  // swap the first path segment (locale) with the new locale
  // e.g. /en/dashboard → /ar/dashboard
  const segments = pathname.split('/');
  if (segments.length > 1 && LOCALES.includes(segments[1] as Locale)) {
    segments[1] = locale;
    return segments.join('/');
  }
  return `/${locale}${pathname}`;
}
