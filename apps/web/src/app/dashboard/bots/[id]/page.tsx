'use client';

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../../lib/api';
import { fmtDate, fmtNum, fmtPnl, fmtTime, pnlClass, shortId } from '../../../../lib/format';
import { allowedCommands, useBotCommand, type BotCommand } from '../../../../lib/useBotCommand';
import {
  Button,
  Card,
  CardHeader,
  ConfirmModal,
  EmptyState,
  ErrorBanner,
  LevelBadge,
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

function LevelStatusBadge({ status }: { status: string }) {
  const cls = status.includes('BUY')
    ? 'bg-up/10 text-up ring-up/25'
    : status.includes('SELL')
      ? 'bg-down/10 text-down ring-down/25'
      : status === 'ERROR'
        ? 'bg-down/15 text-down ring-down/30'
        : 'bg-white/[0.05] text-ink-dim ring-white/10';
  return <span className={`badge ${cls}`}>{status.replace(/_/g, ' ')}</span>;
}

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

  const { run, busy, error: cmdError } = useBotCommand();

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

  const stats = [
    { label: 'Total PnL', value: fmtPnl(totalPnL), cls: pnlClass(totalPnL) },
    { label: 'Realized', value: fmtPnl(bot.realizedPnL), cls: pnlClass(bot.realizedPnL) },
    { label: 'Unrealized', value: fmtPnl(bot.unrealizedPnL), cls: pnlClass(bot.unrealizedPnL) },
    { label: 'Fees paid', value: fmtNum(bot.totalFeesPaid, 4), cls: 'text-ink' },
    { label: 'Buys / Sells', value: `${bot.totalBuys} / ${bot.totalSells}`, cls: 'text-ink' },
    { label: 'Grid cycles', value: String(bot.totalGridCycles), cls: 'text-ink' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-ink">{bot.name}</h2>
            <StatusBadge status={bot.status} />
            <ModeBadge mode={bot.mode} />
          </div>
          <p className="mt-1.5 text-sm text-ink-dim num">
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

      {cmdError && <ErrorBanner message={cmdError} />}
      {busy && !cmdError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-info/25 bg-info/[0.06] px-4 py-3 text-sm text-info">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-info/30 border-t-info animate-spin" />
          Command dispatched: <strong className="font-semibold">{COMMAND_LABELS[busy]}</strong> — worker is processing…
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="card px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{s.label}</p>
            <p className={`mt-1 text-lg font-semibold num ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Price chart */}
      <Card>
        <CardHeader
          title={
            <>
              Price & grid levels <span className="text-xs font-normal text-ink-faint">(1H candles)</span>
            </>
          }
          actions={
            <Button size="sm" variant="secondary" onClick={ingestCandles} disabled={ingestBusy}>
              {ingestBusy ? 'Ingesting…' : 'Load 30d candles from exchange'}
            </Button>
          }
        />
        <div className="p-4">
          <PriceChart candles={(candles || []) as any} gridLevels={gridLevelLines} />
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <div className="border-b border-edge px-4 sm:px-6 flex gap-1 overflow-x-auto">
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
              className={`px-3 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-ink-dim hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'levels' &&
            ((bot.gridLevels || []).length === 0 ? (
              <EmptyState message="No grid levels yet — levels are created when the bot starts." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th className="text-right">Price</th>
                      <th>Status</th>
                      <th className="text-right">Filled qty</th>
                      <th className="text-right">Avg cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bot.gridLevels || []).map((lvl) => (
                      <tr key={lvl.id}>
                        <td className="text-ink-faint">{lvl.levelIndex}</td>
                        <td className="text-right font-mono num">{fmtNum(lvl.price, 8)}</td>
                        <td>
                          <LevelStatusBadge status={lvl.status} />
                        </td>
                        <td className="text-right num">{fmtNum(lvl.filledQuantity, 8)}</td>
                        <td className="text-right num">
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
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Side</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Executed</th>
                      <th>Client Order ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bot.orders || []).map((o) => (
                      <tr key={o.id}>
                        <td className="text-ink-dim">{fmtTime(o.createdAt)}</td>
                        <td><SideBadge side={o.side} /></td>
                        <td>{o.type}</td>
                        <td className="text-ink-dim">{o.status}</td>
                        <td className="text-right font-mono num">{fmtNum(o.price, 8)}</td>
                        <td className="text-right num">{fmtNum(o.quantity, 8)}</td>
                        <td className="text-right num">{fmtNum(o.executedQty, 8)}</td>
                        <td className="font-mono text-xs text-ink-faint">{o.clientOrderId}</td>
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
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Side</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Sum</th>
                      <th className="text-right">Fee</th>
                      <th>Dry run</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bot.fills || []).map((f) => (
                      <tr key={f.id}>
                        <td className="text-ink-dim">{fmtTime(f.timestamp)}</td>
                        <td>
                          <SideBadge side={f.isBuyer ? 'BUY' : 'SELL'} />
                        </td>
                        <td className="text-right font-mono num">{fmtNum(f.price, 8)}</td>
                        <td className="text-right num">{fmtNum(f.quantity, 8)}</td>
                        <td className="text-right num">{fmtNum(f.sum, 4)}</td>
                        <td className="text-right num">{fmtNum(f.fee, 6)}</td>
                        <td className="text-ink-dim">{f.isDryRun ? 'yes' : 'no'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === 'pnl' && <EquityChart points={pnlPoints} label="Total PnL" />}

          {tab === 'events' &&
            ((botEvents || []).length === 0 ? (
              <EmptyState message="No events for this bot yet." />
            ) : (
              <ul className="divide-y divide-edge text-sm">
                {(botEvents || []).map((e) => (
                  <li key={e.id} className="py-3 flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      <LevelBadge level={e.level} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-ink">{e.message}</p>
                      <p className="text-xs text-ink-faint mt-0.5">
                        {e.event} · {fmtDate(e.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </Card>

      <div className="text-xs text-ink-faint font-mono">
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
