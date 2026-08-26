import { defineRouting } from 'next-intl/routing';

/**
 * Supported UI locales. `en` is LTR, `fa` (Persian) is RTL.
 *
 * Locale resolution order (handled across middleware + client):
 *   1. Locale already present in the URL path
 *   2. Authenticated user's saved `preferredLocale` (applied client-side on login)
 *   3. `NEXT_LOCALE` cookie (managed by next-intl middleware)
 *   4. Browser `Accept-Language` header (middleware locale detection)
 *   5. Default: `en`
 */
export const locales = ['en', 'fa'] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'en';

export const LOCALE_COOKIE = 'NEXT_LOCALE';

export const localeDirection: Record<AppLocale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  fa: 'rtl',
};

export function isLocale(value: unknown): value is AppLocale {
  return value === 'en' || value === 'fa';
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Locale prefix is always present in the URL (/en/..., /fa/...).
  localePrefix: 'always',
  // Let the middleware fall back to the Accept-Language header when no
  // cookie/locale is set.
  localeDetection: true,
  localeCookie: {
    name: LOCALE_COOKIE,
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  },
});
