'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/messages/en.json';
import ar from '@/messages/ar.json';

export const LANGUAGE_STORAGE_KEY = 'ordrat-language';
export type AppLanguage = 'en' | 'ar';

const resources = {
  en: { common: en },
  ar: { common: ar },
};

function getInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en';
  const segments = window.location.pathname.split('/');
  if (segments.length > 1 && (segments[1] === 'ar' || segments[1] === 'en')) {
    return segments[1];
  }
  return (localStorage.getItem(LANGUAGE_STORAGE_KEY) as AppLanguage) ?? 'en';
}

const savedLanguage: AppLanguage = getInitialLanguage();

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });
} else {
  i18n.addResourceBundle('en', 'common', en, true, true);
  i18n.addResourceBundle('ar', 'common', ar, true, true);
}

export function changeLanguage(lang: AppLanguage) {
  i18n.changeLanguage(lang);
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    // Toggle Tajawal font class for Arabic
    document.documentElement.classList.toggle('font-arabic', lang === 'ar');
  }
}

export function getLocalePath(locale: string, pathname: string): string {
  const segments = pathname.split('/');
  const LOCALES = ['en', 'ar'];
  if (segments.length > 1 && LOCALES.includes(segments[1])) {
    segments[1] = locale;
    return segments.join('/');
  }
  return `/${locale}${pathname}`;
}

export default i18n;
