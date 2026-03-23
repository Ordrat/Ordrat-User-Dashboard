import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { userHasRouteAccess } from '@/config/roles';

const PUBLIC_PATHS = [
  '/signin',
  '/signup',
  '/reset-password',
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

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = isPublicPath(pathname);

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token && token.error !== 'RefreshAccessTokenError';

  // Authenticated user on a public route → redirect to dashboard home
  if (isPublic && isAuthenticated) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  // Unauthenticated user on a protected route → redirect to sign-in
  if (!isPublic && !isAuthenticated) {
    const signInUrl = new URL('/signin', req.nextUrl);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Authenticated user — check role-based access
  if (!isPublic && isAuthenticated && token) {
    const userRoles: string[] = Array.isArray(token.roles) ? token.roles : [];
    if (!userHasRouteAccess(userRoles, pathname)) {
      return NextResponse.redirect(new URL('/unauthorized', req.nextUrl));
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
    '/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|eot|css|js)$).*)',
  ],
};
