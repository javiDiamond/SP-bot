'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { fmtDate, fmtNum, fmtPnl, pnlClass } from '../../lib/format';
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorBanner,
  LevelBadge,
  ModeBadge,
  Notice,
  PageHeader,
  Spinner,
  StatCard,
  StatusBadge,
} from '../../components/ui';
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
      <PageHeader
        title="Overview"
        subtitle="System status, active bots, and PnL summary"
        actions={
          <>
            <Link href="/dashboard/backtests" className="btn-secondary btn-md">
              Run Backtest
            </Link>
            <Link href="/dashboard/bots/new" className="btn-primary btn-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create New Bot
            </Link>
          </>
        }
      />

      {status?.riskSettings?.killSwitchActive && (
        <ErrorBanner message="Kill switch is ACTIVE. New orders are blocked and running bots are being stopped." />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Running Bots"
          value={statusLoading ? '…' : runningCount}
          tone="blue"
          sub={status ? `${status.counts.pausedBots} paused` : undefined}
        />
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
              <span className="text-up">Healthy</span>
            ) : (
              <span className="text-down">Degraded</span>
            )
          }
          tone={healthy ? 'green' : 'red'}
          sub={status ? `db ${dbOk ? 'ok' : 'down'} · redis ${redisOk ? 'ok' : 'down'}` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Bots"
            subtitle={`${(bots || []).length} configured`}
            actions={
              <Link href="/dashboard/bots" className="link text-sm">
                View all
              </Link>
            }
          />
          {botsLoading ? (
            <Spinner />
          ) : (bots || []).length === 0 ? (
            <EmptyState
              message="No bots yet. Create your first grid bot to get started."
              action={
                <Link href="/dashboard/bots/new" className="btn-primary btn-sm">
                  Create bot
                </Link>
              }
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Symbol</th>
                    <th>Status</th>
                    <th>Mode</th>
                    <th className="text-right">Realized PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {(bots || []).slice(0, 8).map((bot) => (
                    <tr key={bot.id}>
                      <td>
                        <Link href={`/dashboard/bots/${bot.id}`} className="link font-medium">
                          {bot.name}
                        </Link>
                      </td>
                      <td className="font-medium text-ink">{bot.symbol}</td>
                      <td><StatusBadge status={bot.status} /></td>
                      <td><ModeBadge mode={bot.mode} /></td>
                      <td className="text-right font-medium num">
                        <span className={pnlClass(bot.realizedPnL)}>{fmtNum(bot.realizedPnL, 4)}</span>
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
              <Link href="/dashboard/logs" className="link text-sm">
                All logs
              </Link>
            }
          />
          {(events || []).length === 0 ? (
            <EmptyState message="No events recorded yet." />
          ) : (
            <ul className="divide-y divide-edge text-sm">
              {(events || []).map((e) => (
                <li key={e.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <LevelBadge level={e.level} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-ink truncate">{e.message}</p>
                    <p className="text-xs text-ink-faint mt-0.5">
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
        <Notice
          tone="info"
          message={
            <>
              <strong>Paper Trading Mode: </strong>
              bots run in dry-run mode; no real orders are sent to Wallex. Live trading requires
              admin enablement (environment flag, risk settings, and account flag).
            </>
          }
        />
      )}
    </div>
  );
}
