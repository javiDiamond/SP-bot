'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { getToken } from '@/lib/api';

/**
 * Locale-prefixed root (`/en`, `/fa`). The middleware already sends bare `/`
 * straight to `/<locale>/dashboard`; this page only handles direct visits to
 * the locale root and keeps the historic token-based redirect behavior.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getToken() ? '/dashboard' : '/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-deep">
      <div className="h-8 w-8 rounded-full border-2 border-edge-strong border-t-accent animate-spin" />
    </div>
  );
}
