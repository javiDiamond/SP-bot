'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { onRealtimeEvent, startEventStream, stopEventStream } from '../../lib/useEventStream';
import { getToken } from '../../lib/api';
import type { SystemStatusData } from '../../lib/types';

const navigation = [
  { name: 'Overview', href: '/dashboard' },
  { name: 'Bots', href: '/dashboard/bots' },
  { name: 'Backtests', href: '/dashboard/backtests' },
  { name: 'Orders & Fills', href: '/dashboard/orders' },
  { name: 'Exchange', href: '/dashboard/exchange' },
  { name: 'Balances', href: '/dashboard/balances' },
  { name: 'Logs', href: '/dashboard/logs' },
  { name: 'Settings', href: '/dashboard/settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const liveEnv = status?.liveTradingEnv ?? false;

  return (
    <div className="min-h-screen bg-gray-50">
      {killActive && (
        <div className="bg-red-600 text-white text-center text-sm font-semibold py-2 px-4">
          KILL SWITCH ACTIVE — all trading is halted. Deactivate it in Settings to resume.
        </div>
      )}

      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard" className="text-2xl font-bold tracking-tight text-gray-900">
              Wallex Grid Bot
            </Link>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                  liveEnv
                    ? 'bg-red-50 text-red-700 ring-red-600/20'
                    : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                }`}
              >
                {liveEnv ? 'LIVE TRADING ENABLED' : 'DRY RUN MODE'}
              </span>
              {user && (
                <span className="text-sm text-gray-500 hidden sm:inline">
                  {user.email} ({user.role})
                </span>
              )}
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-800 border border-gray-300 rounded-md px-3 py-1.5"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-6rem)]">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive =
                item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}
