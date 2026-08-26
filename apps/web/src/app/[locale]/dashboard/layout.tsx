'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { onRealtimeEvent, startEventStream, stopEventStream } from '@/lib/useEventStream';
import { getToken } from '@/lib/api';
import { BrandMark, ThemeToggle } from '@/components/ui';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import type { SystemStatusData } from '@/lib/types';

function Icon({ d }: { d: string }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

/** Direction-neutral glyphs; the sidebar layout itself mirrors via dir="rtl". */
const navigation: Array<{ key: string; href: string; icon: ReactNode }> = [
  { key: 'overview', href: '/dashboard', icon: <Icon d="M4 5a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zm10-2a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5z" /> },
  { key: 'bots', href: '/dashboard/bots', icon: <Icon d="M8 10h.01M16 10h.01M9.5 15.5a3.5 3.5 0 005 0M12 4V2.5M7 6a5 5 0 0110 0v6a5 5 0 01-5 5h0a5 5 0 01-5-5V6z" /> },
  { key: 'backtests', href: '/dashboard/backtests', icon: <Icon d="M9 17v-4m4 4v-8m4 8V7M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" /> },
  { key: 'orders', href: '/dashboard/orders', icon: <Icon d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" /> },
  { key: 'exchange', href: '/dashboard/exchange', icon: <Icon d="M3 21h18M6 18V9m4 9V5m4 13v-7m4 7V8" /> },
  { key: 'balances', href: '/dashboard/balances', icon: <Icon d="M3 10h18M7 15h2m4 0h4M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" /> },
  { key: 'logs', href: '/dashboard/logs', icon: <Icon d="M4 6h16M4 10h16M4 14h10M4 18h7" /> },
  { key: 'settings', href: '/dashboard/settings', icon: <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, hydrate, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [killActive, setKillActive] = useState(false);

  // Auth guard: hydrate session then redirect if no token
  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    void hydrate();
  }, [router, hydrate]);

  // Realtime stream lifecycle
  useEffect(() => {
    if (!hydrated || !user) return;
    startEventStream();
    const off = onRealtimeEvent((msg) => {
      switch (msg.type) {
        case 'bot.status':
        case 'bot.stats':
          queryClient.invalidateQueries({ queryKey: ['bots'] });
          queryClient.invalidateQueries({ queryKey: ['bot', (msg.payload as any)?.botId] });
          queryClient.invalidateQueries({ queryKey: ['system-status'] });
          break;
        case 'order.update':
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['bot'] });
          break;
        case 'fill.new':
          queryClient.invalidateQueries({ queryKey: ['fills'] });
          queryClient.invalidateQueries({ queryKey: ['bot'] });
          queryClient.invalidateQueries({ queryKey: ['bots'] });
          break;
        case 'killswitch.changed':
          setKillActive(Boolean((msg.payload as any)?.active));
          queryClient.invalidateQueries({ queryKey: ['system-status'] });
          break;
        case 'backtest.progress':
          queryClient.invalidateQueries({ queryKey: ['backtests'] });
          queryClient.invalidateQueries({ queryKey: ['backtest', (msg.payload as any)?.backtestId] });
          break;
        case 'reconciliation.report':
          queryClient.invalidateQueries({ queryKey: ['bot', (msg.payload as any)?.botId] });
          break;
        case 'price.stale':
          queryClient.invalidateQueries({ queryKey: ['bot', (msg.payload as any)?.botId] });
          break;
      }
    });
    return () => {
      off();
      stopEventStream();
    };
  }, [hydrated, user, queryClient]);

  const { data: status } = useQuery({
    queryKey: ['system-status'],
    queryFn: async () => (await api.systemStatus()).data as SystemStatusData,
    enabled: hydrated && Boolean(user),
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (status?.riskSettings?.killSwitchActive !== undefined) {
      setKillActive(status.riskSettings.killSwitchActive);
    }
  }, [status?.riskSettings?.killSwitchActive]);

  if (!hydrated || !getToken()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep">
        <div className="h-8 w-8 rounded-full border-2 border-edge-strong border-t-accent animate-spin" />
      </div>
    );
  }

  const liveEnv = status?.liveTradingEnv ?? false;

  return (
    <div className="min-h-screen bg-deep">
      {killActive && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2.5 bg-down/15 border-b border-down/30 backdrop-blur px-4 py-2">
          <span className="glow-dot bg-down animate-pulse-dot" />
          <p className="text-xs sm:text-sm font-semibold text-down text-center leading-relaxed">
            {t('common.killBanner')}
          </p>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-e border-edge bg-panel/60 min-h-screen sticky top-0">
          <div className="px-5 pt-6 pb-5 border-b border-edge">
            <Link href="/dashboard" aria-label={t('nav.homeAria')}>
              <BrandMark withText />
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {navigation.map((item) => {
              const isActive =
                item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent/10 text-accent shadow-[inset_2px_0_0_0_rgb(var(--accent))] rtl:shadow-[inset_-2px_0_0_0_rgb(var(--accent))]'
                      : 'text-ink-dim hover:text-ink hover:bg-ink/[0.05]'
                  }`}
                >
                  {item.icon}
                  {t(`nav.${item.key}`)}
                </Link>
              );
            })}
          </nav>

          <div className="px-5 py-4 border-t border-edge">
            <span
              className={`badge w-full justify-center ${
                liveEnv ? 'bg-down/10 text-down ring-down/25' : 'bg-warn/10 text-warn ring-warn/25'
              }`}
            >
              <span className={`glow-dot ${liveEnv ? 'bg-down animate-pulse-dot' : 'bg-warn'}`} />
              {liveEnv ? t('common.env.liveEnabled') : t('common.env.dryRunMode')}
            </span>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-40 border-b border-edge bg-deep/85 backdrop-blur">
            <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
              <div className="lg:hidden">
                <Link href="/dashboard" aria-label={t('nav.homeAria')}>
                  <BrandMark size={24} />
                </Link>
              </div>
              <div className="hidden lg:block text-sm text-ink-faint">
                {t('common.headerTagline')}
              </div>

              <div className="flex items-center gap-3">
                {/* mobile env indicator */}
                <span
                  className={`lg:hidden badge ${liveEnv ? 'bg-down/10 text-down ring-down/25' : 'bg-warn/10 text-warn ring-warn/25'}`}
                >
                  {liveEnv ? t('common.env.liveBadge') : t('common.env.dryBadge')}
                </span>
                {user && (
                  <span className="hidden sm:flex items-center gap-2 text-sm text-ink-dim">
                    <span className="w-7 h-7 rounded-full bg-accent/12 ring-1 ring-accent/25 flex items-center justify-center text-xs font-semibold text-accent uppercase">
                      {user.email.charAt(0)}
                    </span>
                    <span className="hidden md:inline" dir="ltr">{user.email}</span>
                    <span className="badge-neutral badge">{user.role}</span>
                  </span>
                )}
                <LanguageSwitcher />
                <ThemeToggle />
                <button onClick={logout} className="btn-secondary btn-sm">
                  {t('common.actions.signOut')}
                </button>
              </div>
            </div>

            {/* Mobile nav */}
            <nav className="lg:hidden border-t border-edge px-2 py-2 flex gap-1 overflow-x-auto">
              {navigation.map((item) => {
                const isActive =
                  item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium ${
                      isActive ? 'bg-accent/10 text-accent' : 'text-ink-dim hover:text-ink hover:bg-ink/[0.05]'
                    }`}
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
