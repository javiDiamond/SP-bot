'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { fmtDate, fmtNum, fmtPnl, pnlClass } from '../../../lib/format';
import { useBotCommand, allowedCommands, type BotCommand } from '../../../lib/useBotCommand';
import {
  Button,
  ConfirmModal,
  EmptyState,
  ErrorBanner,
  ModeBadge,
  Spinner,
  StatusBadge,
} from '../../../components/ui';
import type { BotRow } from '../../../lib/types';
import { useState } from 'react';

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
  const { run, busy, error, clearError } = useBotCommand();
  const [confirm, setConfirm] = useState<{ bot: BotRow; command: BotCommand } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = (bots || []).filter((b) => statusFilter === 'all' || b.status === statusFilter);

  const statuses = ['all', 'DRAFT', 'RUNNING', 'PAUSED', 'STOPPED', 'ERROR', 'KILLED', 'RANGE_EXITED'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bots</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your grid trading bots</p>
        </div>
        <Link
          href="/dashboard/bots/new"
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Create New Bot
        </Link>
      </div>

      {error && <ErrorBanner message={error} />}

      {busy && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-md text-sm text-blue-700">
          Command dispatched: <strong>{COMMAND_LABELS[busy]}</strong> — worker is processing…
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">All Bots</h3>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-gray-300 text-sm border px-3 py-1.5"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All statuses' : s}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState message="No bots found. Create one to start trading." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Symbol</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Grid Cycles</th>
                  <th className="px-6 py-3 text-right">Realized PnL</th>
                  <th className="px-6 py-3 text-right">Unrealized</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filtered.map((bot) => (
                  <tr key={bot.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <Link href={`/dashboard/bots/${bot.id}`} className="text-blue-600 hover:underline font-medium">
                        {bot.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 font-medium">{bot.symbol}</td>
                    <td className="px-6 py-3"><ModeBadge mode={bot.mode} /></td>
                    <td className="px-6 py-3"><StatusBadge status={bot.status} /></td>
                    <td className="px-6 py-3 text-right">{fmtNum(bot.totalGridCycles)}</td>
                    <td className={`px-6 py-3 text-right font-medium ${pnlClass(bot.realizedPnL)}`}>
                      {fmtPnl(bot.realizedPnL)}
                    </td>
                    <td className={`px-6 py-3 text-right ${pnlClass(bot.unrealizedPnL)}`}>
                      {fmtPnl(bot.unrealizedPnL)}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{fmtDate(bot.createdAt)}</td>
                    <td className="px-6 py-3">
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
      </div>

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
