'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Languages } from 'lucide-react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { isLocale, locales, type AppLocale } from '@/i18n/routing';
import { api, getToken } from '@/lib/api';

const OPTION_LABELS: Record<AppLocale, { labelKey: string; shortKey: string; htmlLang: string }> = {
  en: { labelKey: 'switcher.english', shortKey: 'switcher.shortEn', htmlLang: 'en' },
  fa: { labelKey: 'switcher.persian', shortKey: 'switcher.shortFa', htmlLang: 'fa' },
};

/**
 * Two-option language switcher (English / فارسی).
 *
 * Switching:
 *  1. Navigates to the same route + query under the new locale prefix.
 *  2. The server layout immediately re-renders `<html lang dir>`; a client
 *     effect in providers.tsx keeps them in sync mid-transition — no full
 *     page reload.
 *  3. Persists the choice via the NEXT_LOCALE cookie (set automatically by
 *     next-intl on locale transition) and, when authenticated, via the user's
 *     server-side `preferredLocale`.
 */
export function LanguageSwitcher() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const switchTo = (next: AppLocale) => {
    setOpen(false);
    if (!isLocale(next) || next === locale) return;
    // Preserve the current route and query string across the locale switch.
    const search = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`${pathname}${search}`, { locale: next });
    // Best-effort server-side persistence for authenticated users.
    if (getToken()) {
      api.updatePreferredLocale(next).catch(() => {
        /* non-fatal: the cookie already persists the choice */
      });
    }
  };

  const current = isLocale(locale) ? locale : 'en';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('switcher.ariaLabel')}
        title={t('switcher.ariaLabel')}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-edge bg-panel px-2.5 text-xs font-semibold text-ink-dim transition-colors hover:bg-overlay hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        <Languages className="h-[15px] w-[15px]" />
        <span>{t(OPTION_LABELS[current].shortKey)}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('switcher.label')}
          className="absolute end-0 top-full z-50 mt-1.5 w-40 overflow-hidden rounded-lg border border-edge bg-panel shadow-pop"
        >
          {locales.map((loc) => (
            <button
              key={loc}
              type="button"
              role="menuitemradio"
              aria-checked={loc === current}
              lang={OPTION_LABELS[loc].htmlLang}
              dir={loc === 'fa' ? 'rtl' : 'ltr'}
              onClick={() => switchTo(loc)}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-overlay ${
                loc === current ? 'font-semibold text-accent' : 'text-ink-dim'
              }`}
            >
              <span>{t(OPTION_LABELS[loc].labelKey)}</span>
              {loc === current && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
