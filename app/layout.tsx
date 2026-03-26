import { ReactNode, Suspense } from 'react';
import { Inter, Tajawal } from 'next/font/google';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from '@/components/providers/session-provider';
import { I18nProvider } from '@/components/providers/i18n-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { OfflineIndicator } from '@/components/pwa/offline-indicator';
import { SWUpdatePrompt } from '@/components/pwa/sw-update-prompt';
import { SessionWarning } from '@/components/pwa/session-warning';

import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['200', '300', '400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Ordrat',
    default: 'Ordrat Dashboard',
  },
  icons: {
    icon: [
      { url: '/media/app/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/media/app/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/media/app/favicon.ico' },
    ],
    apple: '/media/app/apple-touch-icon.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html className={cn('h-full', inter.variable, tajawal.variable)} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=window.location.pathname.split('/');var l=s[1];if(l==='ar'){document.documentElement.dir='rtl';document.documentElement.lang='ar';document.documentElement.classList.add('font-arabic');}else{document.documentElement.dir='ltr';document.documentElement.lang=l||'en';}})();`,
          }}
        />
        {/* PWA meta tags */}
        <link rel="apple-touch-icon" href="/media/app/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body
        className="antialiased flex h-full text-base text-foreground bg-background font-sans"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          storageKey="ordrat-theme"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <SessionProvider>
            <I18nProvider>
              <QueryProvider>
                <TooltipProvider delayDuration={0}>
                  <OfflineIndicator />
                  <SessionWarning />
                  <SWUpdatePrompt />
                  <Suspense>{children}</Suspense>
                  <Toaster />
                </TooltipProvider>
              </QueryProvider>
            </I18nProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
