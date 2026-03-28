'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Moon, Sun } from 'lucide-react';
import { AuthBrandText } from '@/components/auth/auth-brand-text';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { Button } from '@/components/ui/button';
import { useMounted } from '@/hooks/use-mounted';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation('common');
  const activeTheme = mounted ? resolvedTheme : undefined;

  const toggleTheme = () => {
    setTheme(activeTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <style>
        {`
          .auth-shell .auth-brand-button {
            background-color: var(--brand) !important;
            color: var(--brand-foreground) !important;
            border-color: var(--brand) !important;
          }
          .auth-shell .auth-brand-button:hover:not(:disabled) {
            background-color: color-mix(in srgb, var(--brand) 90%, black) !important;
            border-color: color-mix(in srgb, var(--brand) 90%, black) !important;
          }
          .auth-shell .auth-brand-button:focus-visible {
            --tw-ring-color: color-mix(in srgb, var(--brand) 35%, transparent) !important;
          }
          .auth-shell .auth-hero {
            background-color: var(--background);
          }
          @media (min-width: 1024px) {
            .auth-shell .auth-hero {
              background-image: url('${toAbsoluteUrl('/media/images/2600x1600/1.png')}');
            }
            .dark .auth-shell .auth-hero {
              background-image: url('${toAbsoluteUrl('/media/images/2600x1600/1-dark.png')}');
            }
          }
        `}
      </style>
      <div className="auth-shell relative flex min-h-full grow flex-col overflow-x-hidden lg:justify-center">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:hidden">
          <Link href={`/${locale}`} className="flex items-center">
            <img
              src={toAbsoluteUrl('/media/app/default-logo.svg')}
              className="dark:hidden h-10 w-auto"
              alt="Ordrat"
            />
            <img
              src={toAbsoluteUrl('/media/app/default-logo-dark.svg')}
              className="hidden dark:block h-10 w-auto"
              alt="Ordrat"
            />
          </Link>

          <div className="flex items-center gap-2">
            <Button mode="icon" variant="outline" onClick={toggleTheme} aria-label={t('header.themeToggle')}>
              {activeTheme === 'light' ? <Moon /> : <Sun />}
            </Button>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden lg:flex items-start justify-start px-10 py-8 xl:px-12">
          <Link href={`/${locale}`} className="pointer-events-auto flex items-center">
            <img
              src={toAbsoluteUrl('/media/app/default-logo.svg')}
              className="dark:hidden h-12 w-auto"
              alt="Ordrat"
            />
            <img
              src={toAbsoluteUrl('/media/app/default-logo-dark.svg')}
              className="hidden dark:block h-12 w-auto"
              alt="Ordrat"
            />
          </Link>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:grow">
          <div className="relative order-2 flex justify-center items-start px-6 pb-8 pt-4 sm:px-8 sm:pb-10 lg:order-1 lg:items-center lg:p-10">
            <div className="absolute inset-x-0 top-0 hidden lg:flex justify-end px-10 py-8 xl:px-12">
              <div className="flex items-center gap-2">
                <Button mode="icon" variant="outline" onClick={toggleTheme} aria-label={t('header.themeToggle')}>
                  {activeTheme === 'light' ? <Moon /> : <Sun />}
                </Button>
                <LanguageSwitcher />
              </div>
            </div>

            <div className="w-full max-w-100">
              <Card className="w-full">
                <CardContent className="p-6">{children}</CardContent>
              </Card>
              <div className="pt-4 text-center text-sm text-muted-foreground lg:hidden">
                &copy; 2026 <AuthBrandText text="Ordrat" />. All rights reserved.
              </div>
            </div>

            <div className="absolute bottom-8 inset-x-0 hidden lg:block text-center text-sm text-muted-foreground">
              &copy; 2026 <AuthBrandText text="Ordrat" />. All rights reserved.
            </div>
          </div>

          <div className="auth-hero order-1 bg-background lg:order-2 lg:m-5 lg:rounded-xl lg:border lg:border-border lg:bg-top xxl:bg-center xl:bg-cover bg-no-repeat">
            <div className="flex flex-col items-center px-6 pb-4 pt-8 text-center sm:px-8 lg:min-h-full lg:justify-center lg:px-16 lg:py-16">
              <div className="flex max-w-2xl flex-col items-center gap-3">
                <h3 className="text-2xl font-semibold text-mono sm:text-3xl">
                  {t('auth.heroTitle')}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
