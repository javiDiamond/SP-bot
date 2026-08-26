'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';
import { getToken } from '../../lib/api';
import { BrandMark } from '../../components/ui';

export default function LoginPage() {
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
      await login(email, password);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 bg-gridlines bg-gridlines-fade" aria-hidden />
      <div
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(45,212,160,0.10), transparent 65%)' }}
        aria-hidden
      />

      <div className="relative max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          <BrandMark size={44} />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-ink-dim">Sign in to manage your grid trading bots</p>
        </div>

        <div className="card shadow-pop p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-down/25 bg-down/[0.07] px-3.5 py-3">
                <svg className="w-4 h-4 shrink-0 text-down mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
                </svg>
                <p className="text-sm text-down">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={busy} className="btn-primary btn-md w-full">
              {busy ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-[#04120C]/30 border-t-[#04120C] animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-edge bg-panel/60 px-4 py-3">
          <svg className="w-4 h-4 shrink-0 text-ink-faint mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-xs leading-relaxed text-ink-faint">
            Credentials come from the database seed. Live trading stays disabled until explicitly
            enabled — bots run in dry-run mode by default.
          </p>
        </div>
      </div>
    </div>
  );
}
