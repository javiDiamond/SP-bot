'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { fmtDate, fmtNum, fmtPnl, pnlClass } from '../../../lib/format';
import { useBotCommand, allowedCommands, type BotCommand } from '../../../lib/useBotCommand';
import {
  Button,
  Card,
  CardHeader,
  ConfirmModal,
  EmptyState,
  ErrorBanner,
  ModeBadge,
  PageHeader,
  Spinner,
  StatusBadge,
} from '../../../components/ui';
import type { BotRow } from '../../../lib/types';

const COMMAND_LABELS: Record<BotCommand, string> = {
  start: 'Start',
  pause: 'Pause',
  resume: 'Resume',
  stop: 'Stop',
  'cancel-all': 'Cancel All',
};

export default function BotsPage() {
  const { data: bots, isLoading } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => (await api.bots()).data as BotRow[],
  });
  const { run, busy, error } = useBotCommand();
  const [confirm, setConfirm] = useState<{ bot: BotRow; command: BotCommand } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = (bots || []).filter((b) => statusFilter === 'all' || b.status === statusFilter);

  const statuses = ['all', 'DRAFT', 'RUNNING', 'PAUSED', 'STOPPED', 'ERROR', 'KILLED', 'RANGE_EXITED'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bots"
        subtitle="Manage your grid trading bots"
        actions={
          <Link href="/dashboard/bots/new" className="btn-primary btn-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create New Bot
          </Link>
        }
      />

      {error && <ErrorBanner message={error} />}

      {busy && (
        <div className="flex items-center gap-2.5 rounded-lg border border-info/25 bg-info/[0.06] px-4 py-3 text-sm text-info">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-info/30 border-t-info animate-spin" />
          Command dispatched: <strong className="font-semibold">{COMMAND_LABELS[busy]}</strong> — worker is processing…
        </div>
      )}

      <Card>
        <CardHeader
          title="All Bots"
          actions={
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select !w-auto !py-1.5 !text-sm"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All statuses' : s}
                </option>
              ))}
            </select>
          }
        />

        {isLoading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            message="No bots found. Create one to start trading."
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
                  <th>Mode</th>
                  <th>Status</th>
                  <th className="text-right">Grid Cycles</th>
                  <th className="text-right">Realized PnL</th>
                  <th className="text-right">Unrealized</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bot) => (
                  <tr key={bot.id}>
                    <td>
                      <Link href={`/dashboard/bots/${bot.id}`} className="link font-medium">
                        {bot.name}
                      </Link>
                    </td>
                    <td className="font-medium text-ink">{bot.symbol}</td>
                    <td><ModeBadge mode={bot.mode} /></td>
                    <td><StatusBadge status={bot.status} /></td>
                    <td className="text-right num">{fmtNum(bot.totalGridCycles)}</td>
                    <td className={`text-right font-medium num ${pnlClass(bot.realizedPnL)}`}>
                      {fmtPnl(bot.realizedPnL)}
                    </td>
                    <td className={`text-right num ${pnlClass(bot.unrealizedPnL)}`}>
                      {fmtPnl(bot.unrealizedPnL)}
                    </td>
                    <td className="text-ink-dim">{fmtDate(bot.createdAt)}</td>
                    <td>
                      <div className="flex justify-end gap-1.5 flex-wrap">
                        {allowedCommands(bot.status).map((cmd) => (
                          <Button
                            key={cmd}
                            size="sm"
                            variant={cmd === 'stop' || cmd === 'cancel-all' ? 'danger' : cmd === 'pause' ? 'secondary' : 'success'}
                            onClick={() =>
                              cmd === 'stop' || cmd === 'cancel-all'
                                ? setConfirm({ bot, command: cmd })
                                : void run(bot.id, cmd)
                            }
                          >
                            {COMMAND_LABELS[cmd]}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmModal
        open={confirm !== null}
        title={`${COMMAND_LABELS[confirm?.command || 'stop']} bot`}
        message={`Are you sure you want to ${confirm?.command === 'stop' ? 'stop' : 'cancel all open orders for'} "${confirm?.bot.name}"? ${
          confirm?.command === 'stop' ? 'All open orders will be canceled.' : 'The bot keeps running.'
        }`}
        danger
        confirmLabel={COMMAND_LABELS[confirm?.command || 'stop']}
        busy={busy !== null}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) void run(confirm.bot.id, confirm.command);
          setConfirm(null);
        }}
      />
    </div>
  );
}
