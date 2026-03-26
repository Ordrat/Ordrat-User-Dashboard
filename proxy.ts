import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { userHasRouteAccess } from '@/config/roles';

const LOCALES = ['en', 'ar'] as const;
const DEFAULT_LOCALE = 'en';

const PUBLIC_PATHS = [
  '/signin',
  '/signup',
  '/forgot-password',
  '/verify-otp',
  '/change-password',
  '/verify-email',
  '/auth',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

function getLocaleAndPath(pathname: string): {
  locale: string;
  pathWithoutLocale: string;
} {
  const segments = pathname.split('/');
  // segments[0] is '' (before leading slash)
  const maybeLocale = segments[1];

  if (LOCALES.includes(maybeLocale as (typeof LOCALES)[number])) {
    const pathWithoutLocale = '/' + segments.slice(2).join('/') || '/';
    return { locale: maybeLocale, pathWithoutLocale };
  }

  return { locale: DEFAULT_LOCALE, pathWithoutLocale: pathname };
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip root path (handled by app/page.tsx redirect to /en)
  if (pathname === '/') {
    return NextResponse.next();
  }

  const { locale, pathWithoutLocale } = getLocaleAndPath(pathname);

  // If no locale prefix, redirect to default locale
  const segments = pathname.split('/');
  const maybeLocale = segments[1];
  if (!LOCALES.includes(maybeLocale as (typeof LOCALES)[number])) {
    return NextResponse.redirect(
      new URL(`/${DEFAULT_LOCALE}${pathname}`, req.nextUrl),
    );
  }

  const isPublic = isPublicPath(pathWithoutLocale);

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token && token.error !== 'RefreshAccessTokenError';

  // Authenticated user on a public route → redirect to dashboard home
  if (isPublic && isAuthenticated) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.nextUrl));
  }

  // Unauthenticated user on a protected route → redirect to sign-in
  if (!isPublic && !isAuthenticated) {
    const signInUrl = new URL(`/${locale}/signin`, req.nextUrl);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Authenticated user — check role-based access
  if (!isPublic && isAuthenticated && token) {
    const userRoles: string[] = Array.isArray(token.roles) ? token.roles : [];
    if (!userHasRouteAccess(userRoles, pathWithoutLocale)) {
      return NextResponse.redirect(
        new URL(`/${locale}/unauthorized`, req.nextUrl),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on all paths except:
     * - /api/* (NextAuth and other API routes)
     * - /_next/static (static files)
     * - /_next/image (image optimisation)
     * - /favicon.ico, /sitemap.xml, /robots.txt, and common static extensions
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|sw\\.js|workbox-.*|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|eot|css|js)$).*)',
  ],
};
