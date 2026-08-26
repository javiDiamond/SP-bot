'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { fmtDate, fmtNum, fmtPnl, pnlClass } from '../../lib/format';
import { Card, CardHeader, EmptyState, ModeBadge, Spinner, StatCard, StatusBadge, ErrorBanner } from '../../components/ui';
import type { BotRow, EventLogRow, SystemStatusData } from '../../lib/types';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['system-status'],
    queryFn: async () => (await api.systemStatus()).data as SystemStatusData,
    refetchInterval: 15_000,
  });

  const { data: bots, isLoading: botsLoading } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => (await api.bots()).data as BotRow[],
  });

  const { data: events } = useQuery({
    queryKey: ['events-overview'],
    queryFn: async () => (await api.events({ limit: 12 })).data as EventLogRow[],
    refetchInterval: 30_000,
  });

  const totalRealized = (bots || []).reduce((acc, b) => acc + Number(b.realizedPnL || 0), 0);
  const totalUnrealized = (bots || []).reduce((acc, b) => acc + Number(b.unrealizedPnL || 0), 0);
  const totalTrades = (bots || []).reduce((acc, b) => acc + b.totalBuys + b.totalSells, 0);
  const runningCount = (bots || []).filter((b) => b.status === 'RUNNING').length;
  const dbOk = status?.services?.database;
  const redisOk = status?.services?.redis;
  const healthy = Boolean(dbOk && redisOk) && !status?.riskSettings?.killSwitchActive;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
          <p className="mt-1 text-sm text-gray-500">System status, active bots, and PnL summary</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/bots/new"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Create New Bot
          </Link>
          <Link
            href="/dashboard/backtests"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
          >
            Run Backtest
          </Link>
        </div>
      </div>

      {status?.riskSettings?.killSwitchActive && (
        <ErrorBanner message="Kill switch is ACTIVE. New orders are blocked and running bots are being stopped." />
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Running Bots" value={statusLoading ? '…' : runningCount} tone="blue" sub={status ? `${status.counts.pausedBots} paused` : undefined} />
        <StatCard
          label="Total PnL"
          value={<span className={pnlClass(totalRealized + totalUnrealized)}>{fmtPnl(totalRealized + totalUnrealized)}</span>}
          tone="green"
          sub={`realized ${fmtPnl(totalRealized)} · unrealized ${fmtPnl(totalUnrealized)}`}
        />
        <StatCard label="Total Trades" value={totalTrades} tone="purple" />
        <StatCard
          label="System Status"
          value={
            statusLoading ? (
              '…'
            ) : healthy ? (
              <span className="text-green-600 text-xl">Healthy</span>
            ) : (
              <span className="text-red-600 text-xl">Degraded</span>
            )
          }
          tone={healthy ? 'green' : 'red'}
          sub={status ? `db ${dbOk ? 'ok' : 'down'} · redis ${redisOk ? 'ok' : 'down'}` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Bots"
            subtitle={`${(bots || []).length} configured`}
            actions={
              <Link href="/dashboard/bots" className="text-sm text-blue-600 hover:text-blue-800">
                View all
              </Link>
            }
          />
          {botsLoading ? (
            <Spinner />
          ) : (bots || []).length === 0 ? (
            <EmptyState message="No bots yet. Create your first grid bot to get started." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Symbol</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Mode</th>
                    <th className="px-6 py-3 text-right">Realized PnL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {(bots || []).slice(0, 8).map((bot) => (
                    <tr key={bot.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <Link href={`/dashboard/bots/${bot.id}`} className="text-blue-600 hover:underline">
                          {bot.name}
                        </Link>
                      </td>
                      <td className="px-6 py-3 font-medium">{bot.symbol}</td>
                      <td className="px-6 py-3"><StatusBadge status={bot.status} /></td>
                      <td className="px-6 py-3"><ModeBadge mode={bot.mode} /></td>
                      <td className={`px-6 py-3 text-right font-medium ${pnlClass(bot.realizedPnL)}`}>
                        {fmtNum(bot.realizedPnL, 4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent Events"
            actions={
              <Link href="/dashboard/logs" className="text-sm text-blue-600 hover:text-blue-800">
                All logs
              </Link>
            }
          />
          {(events || []).length === 0 ? (
            <EmptyState message="No events recorded yet." />
          ) : (
            <ul className="divide-y divide-gray-200 text-sm">
              {(events || []).map((e) => (
                <li key={e.id} className="px-6 py-3 flex items-start gap-3">
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${
                      e.level === 'ERROR'
                        ? 'bg-red-100 text-red-700'
                        : e.level === 'WARN'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {e.level}
                  </span>
                  <div className="min-w-0">
                    <p className="text-gray-800 truncate">{e.message}</p>
                    <p className="text-xs text-gray-400">
                      {e.event} · {fmtDate(e.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {!isAdmin && status?.riskSettings?.allowLiveTrading !== true && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
          <p className="text-sm text-blue-700">
            <strong className="font-medium">Paper Trading Mode: </strong>
            bots run in dry-run mode; no real orders are sent to Wallex. Live trading requires
            admin enablement (environment flag, risk settings, and account flag).
          </p>
        </div>
      )}
    </div>
  );
}
