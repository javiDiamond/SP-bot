'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { fmtDate, fmtNum, fmtPnl, fmtTime, pnlClass, shortId } from '@/lib/format';
import { allowedCommands, useBotCommand, type BotCommand } from '@/lib/useBotCommand';
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
} from '@/components/ui';
import { PriceChart } from '@/components/PriceChart';
import { EquityChart } from '@/components/EquityChart';
import type { BotRow, CandleRow, EventLogRow } from '@/lib/types';

const COMMAND_KEYS: Record<BotCommand, string> = {
  start: 'start',
  pause: 'pause',
  resume: 'resume',
  stop: 'stop',
  'cancel-all': 'cancelAll',
};

type Tab = 'levels' | 'orders' | 'fills' | 'pnl' | 'events';

function LevelStatusBadge({ status }: { status: string }) {
  const t = useTranslations('common.gridLevelStatus');
  const cls = status.includes('BUY')
    ? 'bg-up/10 text-up ring-up/25'
    : status.includes('SELL')
      ? 'bg-down/10 text-down ring-down/25'
      : status === 'ERROR'
        ? 'bg-down/15 text-down ring-down/30'
        : 'badge-neutral';
  return <span className={`badge ${cls}`}>{t(status as 'IDLE')}</span>;
}

export default function BotDetailPage() {
  const t = useTranslations('bots.detail');
  const tc = useTranslations('common');
  const tb = useTranslations('bots');
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('levels');
  const [confirm, setConfirm] = useState<{ command: BotCommand } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [ingestBusy, setIngestBusy] = useState(false);

  const commandLabel = (cmd: BotCommand) => tb(`commands.${COMMAND_KEYS[cmd]}`);

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
      alert(err?.message || t('ingestFailed'));
    }
  }, [bot, queryClient, t]);

  const handleDelete = async () => {
    try {
      await api.deleteBot(id);
      router.push('/dashboard/bots');
    } catch (err: any) {
      alert(err?.message || t('deleteFailed'));
      setDeleteConfirm(false);
    }
  };

  if (isLoading) return <Spinner />;
  if (error || !bot) {
    return <ErrorBanner message={(error as any)?.message || t('notFound')} />;
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
    { label: t('statTotalPnl'), value: fmtPnl(totalPnL), cls: pnlClass(totalPnL) },
    { label: t('statRealized'), value: fmtPnl(bot.realizedPnL), cls: pnlClass(bot.realizedPnL) },
    { label: t('statUnrealized'), value: fmtPnl(bot.unrealizedPnL), cls: pnlClass(bot.unrealizedPnL) },
    { label: t('statFees'), value: fmtNum(bot.totalFeesPaid, 4), cls: 'text-ink' },
    { label: t('statBuysSells'), value: `${bot.totalBuys} / ${bot.totalSells}`, cls: 'text-ink' },
    { label: t('statGridCycles'), value: String(bot.totalGridCycles), cls: 'text-ink' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-ink">{bot.name}</h2>
            <StatusBadge status={bot.status} />
            <ModeBadge mode={bot.mode} />
          </div>
          <p className="mt-1.5 text-sm text-ink-dim num leading-relaxed">
            {t('metaLine', {
              symbol: bot.symbol,
              gridType: tb(`gridType.${config.gridType}`),
              gridCount: config.gridCount,
              lower: fmtNum(config.lowerPrice, 6),
              upper: fmtNum(config.upperPrice, 6),
              date: fmtDate(bot.createdAt),
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {allowedCommands(bot.status).map((cmd) => (
            <Button
              key={cmd}
              variant={cmd === 'stop' || cmd === 'cancel-all' ? 'danger' : cmd === 'pause' ? 'secondary' : 'success'}
              onClick={() =>
                cmd === 'stop' || cmd === 'cancel-all' ? setConfirm({ command: cmd }) : void run(id, cmd)
              }
            >
              {commandLabel(cmd)}
            </Button>
          ))}
          {['DRAFT', 'STOPPED', 'ERROR', 'RANGE_EXITED', 'KILLED'].includes(bot.status) && (
            <Button variant="ghost" onClick={() => setDeleteConfirm(true)}>
              {t('delete')}
            </Button>
          )}
        </div>
      </div>

      {cmdError && <ErrorBanner message={cmdError} />}
      {busy && !cmdError && (
        <div className="flex items-center gap-2.5 rounded-lg border border-info/25 bg-info/[0.06] px-4 py-3 text-sm text-info">
          <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-info/30 border-t-info animate-spin" />
          <span className="leading-relaxed">{tc('busyBanner', { command: commandLabel(busy) })}</span>
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
              {t('chartTitle')} <span className="text-xs font-normal text-ink-faint">{t('chartSub')}</span>
            </>
          }
          actions={
            <Button size="sm" variant="secondary" onClick={ingestCandles} disabled={ingestBusy}>
              {ingestBusy ? t('ingesting') : t('ingestButton')}
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
              ['levels', t('tabGridLevels', { count: (bot.gridLevels || []).length })],
              ['orders', t('tabOrders', { count: (bot.orders || []).length })],
              ['fills', t('tabFills', { count: (bot.fills || []).length })],
              ['pnl', t('tabPnl')],
              ['events', t('tabEvents')],
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
              <EmptyState message={t('noLevels')} />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th className="text-end">{t('thPrice')}</th>
                      <th>{t('thStatus')}</th>
                      <th className="text-end">{t('thFilledQty')}</th>
                      <th className="text-end">{t('thAvgCost')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bot.gridLevels || []).map((lvl) => (
                      <tr key={lvl.id}>
                        <td className="text-ink-faint">{lvl.levelIndex}</td>
                        <td className="text-end font-mono num">{fmtNum(lvl.price, 8)}</td>
                        <td>
                          <LevelStatusBadge status={lvl.status} />
                        </td>
                        <td className="text-end num">{fmtNum(lvl.filledQuantity, 8)}</td>
                        <td className="text-end num">
                          {lvl.averageCost ? fmtNum(lvl.averageCost, 8) : tc('dash')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === 'orders' &&
            ((bot.orders || []).length === 0 ? (
              <EmptyState message={t('noOrders')} />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('thTime')}</th>
                      <th>{t('thSide')}</th>
                      <th>{t('thType')}</th>
                      <th>{t('thStatus')}</th>
                      <th className="text-end">{t('thPrice')}</th>
                      <th className="text-end">{t('thQty')}</th>
                      <th className="text-end">{t('thExecuted')}</th>
                      <th>{t('thClientOrderId')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bot.orders || []).map((o) => (
                      <tr key={o.id}>
                        <td className="text-ink-dim">{fmtTime(o.createdAt)}</td>
                        <td><SideBadge side={o.side} /></td>
                        <td>{o.type}</td>
                        <td className="text-ink-dim">{tc(`orderStatus.${o.status}` as 'NEW')}</td>
                        <td className="text-end font-mono num">{fmtNum(o.price, 8)}</td>
                        <td className="text-end num">{fmtNum(o.quantity, 8)}</td>
                        <td className="text-end num">{fmtNum(o.executedQty, 8)}</td>
                        <td className="font-mono text-xs text-ink-faint" dir="ltr">{o.clientOrderId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === 'fills' &&
            ((bot.fills || []).length === 0 ? (
              <EmptyState message={t('noFills')} />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('thTime')}</th>
                      <th>{t('thSide')}</th>
                      <th className="text-end">{t('thPrice')}</th>
                      <th className="text-end">{t('thQty')}</th>
                      <th className="text-end">{t('thSum')}</th>
                      <th className="text-end">{t('thFee')}</th>
                      <th>{t('thDryRun')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bot.fills || []).map((f) => (
                      <tr key={f.id}>
                        <td className="text-ink-dim">{fmtTime(f.timestamp)}</td>
                        <td>
                          <SideBadge side={f.isBuyer ? 'BUY' : 'SELL'} />
                        </td>
                        <td className="text-end font-mono num">{fmtNum(f.price, 8)}</td>
                        <td className="text-end num">{fmtNum(f.quantity, 8)}</td>
                        <td className="text-end num">{fmtNum(f.sum, 4)}</td>
                        <td className="text-end num">{fmtNum(f.fee, 6)}</td>
                        <td className="text-ink-dim">{f.isDryRun ? tc('yes') : tc('no')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === 'pnl' && <EquityChart points={pnlPoints} label={t('pnlCurveLabel')} />}

          {tab === 'events' &&
            ((botEvents || []).length === 0 ? (
              <EmptyState message={t('noEvents')} />
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
        {t('botIdLine', { id: shortId(bot.id) })}{' '}
        {bot.exchangeAccountId ? t('botIdAccount', { id: shortId(bot.exchangeAccountId) }) : ''}
      </div>

      <ConfirmModal
        open={confirm !== null}
        title={tb('commands.confirmTitle', { command: commandLabel(confirm?.command || 'stop') })}
        message={
          confirm?.command === 'stop'
            ? t('confirmStopMessage')
            : t('confirmCancelAllMessage')
        }
        danger
        confirmLabel={commandLabel(confirm?.command || 'stop')}
        busy={busy !== null}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) void run(id, confirm.command);
          setConfirm(null);
        }}
      />

      <ConfirmModal
        open={deleteConfirm}
        title={t('deleteTitle')}
        message={t('deleteMessage', { name: bot.name })}
        danger
        confirmLabel={t('delete')}
        onCancel={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
