'use client';

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../../lib/api';
import { fmtDate, fmtNum, fmtPnl, fmtTime, pnlClass, shortId } from '../../../../lib/format';
import { allowedCommands, useBotCommand, type BotCommand } from '../../../../lib/useBotCommand';
import {
  Button,
  ConfirmModal,
  EmptyState,
  ErrorBanner,
  ModeBadge,
  SideBadge,
  Spinner,
  StatusBadge,
} from '../../../../components/ui';
import { PriceChart } from '../../../../components/PriceChart';
import { EquityChart } from '../../../../components/EquityChart';
import type { BotRow, CandleRow, EventLogRow } from '../../../../lib/types';

const COMMAND_LABELS: Record<BotCommand, string> = {
  start: 'Start',
  pause: 'Pause',
  resume: 'Resume',
  stop: 'Stop',
  'cancel-all': 'Cancel All',
};

type Tab = 'levels' | 'orders' | 'fills' | 'pnl' | 'events';

export default function BotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('levels');
  const [confirm, setConfirm] = useState<{ command: BotCommand } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [ingestBusy, setIngestBusy] = useState(false);

  const { data: bot, isLoading, error } = useQuery({
    queryKey: ['bot', id],
    queryFn: async () => (await api.bot(id)).data as BotRow,
    refetchInterval: (q) => {
      const status = (q.state.data as BotRow | undefined)?.status;
      return status === 'STARTING' || status === 'PAUSING' || status === 'STOPPING' ? 3000 : 10_000;
    },
  });

  const { data: candles } = useQuery({
    queryKey: ['candles', bot?.symbol, '1H'],
    queryFn: async () =>
      (await api.candles(bot!.symbol, { resolution: '1H', limit: 720 })).data as CandleRow[],
    enabled: Boolean(bot?.symbol),
    staleTime: 60_000,
  });

  const { data: botEvents } = useQuery({
    queryKey: ['bot-events', id],
    queryFn: async () => (await api.events({ botId: id, limit: 50 })).data as EventLogRow[],
    enabled: tab === 'events',
    refetchInterval: 15_000,
  });

  const { run, busy, error: cmdError, clearError } = useBotCommand();

  const ingestCandles = useCallback(async () => {
    if (!bot) return;
    setIngestBusy(true);
    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - 30 * 24 * 3600;
      await api.ingestCandles(bot.symbol, { resolution: '1H', from, to });
      // Give the worker a moment, then refetch
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['candles', bot.symbol] });
        setIngestBusy(false);
      }, 5000);
    } catch (err: any) {
      setIngestBusy(false);
      alert(err?.message || 'Failed to enqueue candle ingestion');
    }
  }, [bot, queryClient]);

  const handleDelete = async () => {
    try {
      await api.deleteBot(id);
      router.push('/dashboard/bots');
    } catch (err: any) {
      alert(err?.message || 'Delete failed');
      setDeleteConfirm(false);
    }
  };

  if (isLoading) return <Spinner />;
  if (error || !bot) {
    return <ErrorBanner message={(error as any)?.message || 'Bot not found'} />;
  }

  const config = bot.gridConfig;
  const totalPnL = Number(bot.realizedPnL) + Number(bot.unrealizedPnL);
  const pnlPoints = (bot.pnlSnapshots || []).map((s) => ({
    timestamp: s.timestamp,
    value: Number(s.totalPnL),
  }));

  const gridLevelLines = (bot.gridLevels || []).map((l) => ({
    price: l.price,
    active: l.status !== 'IDLE',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{bot.name}</h2>
            <StatusBadge status={bot.status} />
            <ModeBadge mode={bot.mode} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {bot.symbol} · {config.gridType} · {config.gridCount} grids ·{' '}
            {fmtNum(config.lowerPrice, 6)} – {fmtNum(config.upperPrice, 6)} · created{' '}
            {fmtDate(bot.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {allowedCommands(bot.status).map((cmd) => (
            <Button
              key={cmd}
              variant={cmd === 'stop' || cmd === 'cancel-all' ? 'danger' : cmd === 'pause' ? 'secondary' : 'success'}
              onClick={() =>
                cmd === 'stop' || cmd === 'cancel-all' ? setConfirm({ command: cmd }) : void run(id, cmd)
              }
            >
              {COMMAND_LABELS[cmd]}
            </Button>
          ))}
          {['DRAFT', 'STOPPED', 'ERROR', 'RANGE_EXITED', 'KILLED'].includes(bot.status) && (
            <Button variant="ghost" onClick={() => setDeleteConfirm(true)}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {(cmdError || busy) && (
        <div
          className={`border-l-4 p-3 rounded-md text-sm ${
            cmdError
              ? 'bg-red-50 border-red-400 text-red-700'
              : 'bg-blue-50 border-blue-400 text-blue-700'
          }`}
        >
          {cmdError || `Command dispatched: ${busy && COMMAND_LABELS[busy]} — worker is processing…`}
          {cmdError && (
            <button onClick={clearError} className="ml-2 underline">
              dismiss
            </button>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total PnL', value: fmtPnl(totalPnL), cls: pnlClass(totalPnL) },
          { label: 'Realized', value: fmtPnl(bot.realizedPnL), cls: pnlClass(bot.realizedPnL) },
          { label: 'Unrealized', value: fmtPnl(bot.unrealizedPnL), cls: pnlClass(bot.unrealizedPnL) },
          { label: 'Fees paid', value: fmtNum(bot.totalFeesPaid, 4), cls: 'text-gray-700' },
          { label: 'Buys / Sells', value: `${bot.totalBuys} / ${bot.totalSells}`, cls: 'text-gray-700' },
          { label: 'Grid cycles', value: String(bot.totalGridCycles), cls: 'text-gray-700' },
        ].map((s) => (
          <div key={s.label} className="bg-white shadow rounded-lg p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-lg font-semibold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Price chart */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Price & grid levels <span className="text-sm text-gray-400">(1H candles)</span>
          </h3>
          <Button size="sm" variant="secondary" onClick={ingestCandles} disabled={ingestBusy}>
            {ingestBusy ? 'Ingesting…' : 'Load 30d candles from exchange'}
          </Button>
        </div>
        <div className="p-4">
          <PriceChart candles={(candles || []) as any} gridLevels={gridLevelLines} />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200 px-6 flex gap-6">
          {(
            [
              ['levels', `Grid Levels (${(bot.gridLevels || []).length})`],
              ['orders', `Orders (${(bot.orders || []).length})`],
              ['fills', `Fills (${(bot.fills || []).length})`],
              ['pnl', 'PnL Curve'],
              ['events', 'Events'],
            ] as Array<[Tab, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`py-3 text-sm font-medium border-b-2 -mb-px ${
                tab === key
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'levels' &&
            ((bot.gridLevels || []).length === 0 ? (
              <EmptyState message="No grid levels yet — levels are created when the bot starts." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-2">#</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2 text-right">Filled qty</th>
                      <th className="px-4 py-2 text-right">Avg cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(bot.gridLevels || []).map((lvl) => (
                      <tr key={lvl.id}>
                        <td className="px-4 py-2 text-gray-500">{lvl.levelIndex}</td>
                        <td className="px-4 py-2 text-right font-mono">{fmtNum(lvl.price, 8)}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                              lvl.status.includes('BUY')
                                ? 'bg-green-50 text-green-700'
                                : lvl.status.includes('SELL')
                                  ? 'bg-red-50 text-red-700'
                                  : lvl.status === 'ERROR'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {lvl.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">{fmtNum(lvl.filledQuantity, 8)}</td>
                        <td className="px-4 py-2 text-right">
                          {lvl.averageCost ? fmtNum(lvl.averageCost, 8) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === 'orders' &&
            ((bot.orders || []).length === 0 ? (
              <EmptyState message="No orders yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-2">Time</th>
                      <th className="px-4 py-2">Side</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Qty</th>
                      <th className="px-4 py-2 text-right">Executed</th>
                      <th className="px-4 py-2">Client Order ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(bot.orders || []).map((o) => (
                      <tr key={o.id}>
                        <td className="px-4 py-2 text-gray-500">{fmtTime(o.createdAt)}</td>
                        <td className="px-4 py-2"><SideBadge side={o.side} /></td>
                        <td className="px-4 py-2">{o.type}</td>
                        <td className="px-4 py-2">{o.status}</td>
                        <td className="px-4 py-2 text-right font-mono">{fmtNum(o.price, 8)}</td>
                        <td className="px-4 py-2 text-right">{fmtNum(o.quantity, 8)}</td>
                        <td className="px-4 py-2 text-right">{fmtNum(o.executedQty, 8)}</td>
                        <td className="px-4 py-2 font-mono text-xs text-gray-400">{o.clientOrderId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === 'fills' &&
            ((bot.fills || []).length === 0 ? (
              <EmptyState message="No fills yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-2">Time</th>
                      <th className="px-4 py-2">Side</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Qty</th>
                      <th className="px-4 py-2 text-right">Sum</th>
                      <th className="px-4 py-2 text-right">Fee</th>
                      <th className="px-4 py-2">Dry run</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(bot.fills || []).map((f) => (
                      <tr key={f.id}>
                        <td className="px-4 py-2 text-gray-500">{fmtTime(f.timestamp)}</td>
                        <td className="px-4 py-2">
                          <SideBadge side={f.isBuyer ? 'BUY' : 'SELL'} />
                        </td>
                        <td className="px-4 py-2 text-right font-mono">{fmtNum(f.price, 8)}</td>
                        <td className="px-4 py-2 text-right">{fmtNum(f.quantity, 8)}</td>
                        <td className="px-4 py-2 text-right">{fmtNum(f.sum, 4)}</td>
                        <td className="px-4 py-2 text-right">{fmtNum(f.fee, 6)}</td>
                        <td className="px-4 py-2">{f.isDryRun ? 'yes' : 'no'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === 'pnl' && (
            <EquityChart points={pnlPoints} label="Total PnL" />
          )}

          {tab === 'events' &&
            ((botEvents || []).length === 0 ? (
              <EmptyState message="No events for this bot yet." />
            ) : (
              <ul className="divide-y divide-gray-200 text-sm">
                {(botEvents || []).map((e) => (
                  <li key={e.id} className="py-2.5 flex items-start gap-3">
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
                      <p className="text-gray-800">{e.message}</p>
                      <p className="text-xs text-gray-400">
                        {e.event} · {fmtDate(e.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </div>

      <div className="text-xs text-gray-400">
        Bot ID {shortId(bot.id)} {bot.exchangeAccountId ? `· account ${shortId(bot.exchangeAccountId)}` : ''}
      </div>

      <ConfirmModal
        open={confirm !== null}
        title={`${COMMAND_LABELS[confirm?.command || 'stop']} bot`}
        message={
          confirm?.command === 'stop'
            ? 'Stop this bot? All open orders will be canceled and the engine will shut down.'
            : 'Cancel ALL open orders for this bot? The engine keeps running and may re-quote.'
        }
        danger
        confirmLabel={COMMAND_LABELS[confirm?.command || 'stop']}
        busy={busy !== null}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) void run(id, confirm.command);
          setConfirm(null);
        }}
      />

      <ConfirmModal
        open={deleteConfirm}
        title="Delete bot"
        message={`Permanently delete "${bot.name}" and its orders/fills history? This cannot be undone.`}
        danger
        confirmLabel="Delete"
        onCancel={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
