import { isLocale, LOCALE_COOKIE, type AppLocale } from '@/i18n/routing';

/** The locale currently active in the document (authoritative for imperative code). */
export function activeLocale(): AppLocale {
  if (typeof document === 'undefined') return 'en';
  const lang = document.documentElement.lang;
  return isLocale(lang) ? lang : 'en';
}

/**
 * Prefix an absolute path with the active locale, for imperative redirects
 * (`window.location.href = localePath('/login')`).
 */
export function localePath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/${activeLocale()}${normalized}`;
}

/** Persist the chosen locale in the cookie read by the middleware. */
export function setLocaleCookie(locale: AppLocale): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}
