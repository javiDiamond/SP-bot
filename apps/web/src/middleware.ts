import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Resolves the locale for prefix-less requests using next-intl's own detection
 * order (NEXT_LOCALE cookie -> Accept-Language -> default `en`).
 *
 * Special case: `/` is redirected straight to the resolved locale's dashboard
 * (the dashboard's own auth guard sends unauthenticated visitors to /login,
 * preserving the locale prefix).
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    const intlResponse = intlMiddleware(request);
    // next-intl redirects `/` -> `/<locale>`; follow that decision but land
    // directly on the dashboard route of the resolved locale.
    const location = intlResponse.headers.get('location');
    if (location) {
      const target = new URL(location, request.url);
      const response = NextResponse.redirect(
        new URL(`${target.pathname.replace(/\/$/, '')}/dashboard`, request.url),
      );
      // Carry over the NEXT_LOCALE cookie next-intl just decided on.
      for (const cookie of intlResponse.cookies.getAll()) {
        response.cookies.set(cookie);
      }
      return response;
    }
    return intlResponse;
  }

  return intlMiddleware(request);
}

export const config = {
  // Exclude /api, Next.js internals and static files (.svg, .png, ...).
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
