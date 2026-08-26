'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { isLocale, localeDirection } from '@/i18n/routing';
import { setFormatContext } from '@/lib/format';
import { getPreferences, subscribePreferences } from '@/lib/preferences';

/**
 * Keeps the imperative formatting engine (lib/format.ts) in sync with the
 * active locale and display preferences.
 *
 * The synchronous part runs during render (idempotent and deterministic per
 * locale) so the very first client render already formats with the active
 * locale — no English→Persian formatting flash.
 */
function FormatContextSync() {
  const locale = useLocale();

  setFormatContext({ locale, prefs: getPreferences() });

  useEffect(() => {
    // Re-sync when the user changes digit style / calendar preferences.
    const resync = () => setFormatContext({ locale, prefs: getPreferences() });
    resync();
    return subscribePreferences(resync);
  }, [locale]);

  useEffect(() => {
    // Belt-and-braces: keep <html lang|dir> correct during client-side locale
    // transitions (the server layout also sets both attributes).
    const root = document.documentElement;
    root.lang = locale;
    root.dir = isLocale(locale) ? localeDirection[locale] : 'ltr';
  }, [locale]);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  const client = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5_000,
          },
        },
      }),
    [],
  );

  return (
    <QueryClientProvider client={client}>
      <FormatContextSync />
      {children}
    </QueryClientProvider>
  );
}
