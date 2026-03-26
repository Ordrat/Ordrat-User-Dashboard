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
