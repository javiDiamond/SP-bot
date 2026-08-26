'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/lib/store';
import { getToken } from '@/lib/api';
import { apiErrorKey } from '@/lib/errors';
import { BrandMark, ThemeToggle } from '@/components/ui';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function LoginPage() {
  const t = useTranslations('login');
  const tr = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getToken() && !user) router.replace('/dashboard');
  }, [router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { preferredLocale } = await login(email, password);
      // Honour the user's stored language preference: if it differs from the
      // current locale, navigate to the dashboard under that locale prefix.
      if (preferredLocale && preferredLocale !== locale) {
        window.location.href = `/${preferredLocale}/dashboard`;
        return;
      }
      router.replace('/dashboard');
    } catch (err: any) {
      const key = apiErrorKey(err);
      setError(key ? tr(key) : err?.message || t('errorDefault'));
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute top-4 end-4 z-10 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 bg-gridlines bg-gridlines-fade" aria-hidden />
      <div
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgb(var(--accent) / 0.10), transparent 65%)' }}
        aria-hidden
      />

      <div className="relative max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          <BrandMark size={44} />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
            {t('title')}
          </h1>
          <p className="mt-1.5 text-sm text-ink-dim text-center">{t('subtitle')}</p>
        </div>

        <div className="card shadow-pop p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-down/25 bg-down/[0.07] px-3.5 py-3">
                <svg className="w-4 h-4 shrink-0 text-down mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
                </svg>
                <p className="text-sm text-down leading-relaxed">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">{t('emailLabel')}</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input text-start"
                placeholder={t('emailPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">{t('passwordLabel')}</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input text-start"
                placeholder={t('passwordPlaceholder')}
              />
            </div>

            <button type="submit" disabled={busy} className="btn-primary btn-md w-full">
              {busy ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-on-accent/30 border-t-on-accent animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                t('submit')
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-edge bg-panel/60 px-4 py-3">
          <svg className="w-4 h-4 shrink-0 text-ink-faint mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-xs leading-relaxed text-ink-faint">
            {t('securityNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
