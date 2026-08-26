'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@/i18n/navigation';
import { api, downloadWithAuth } from '@/lib/api';
import { fmtDate, fmtNum } from '@/lib/format';
import { Button, Card, CardHeader, EmptyState, ErrorBanner, Notice, SideBadge, Spinner } from '@/components/ui';
import { EquityChart } from '@/components/EquityChart';
import type { BacktestRow } from '@/lib/types';

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'red' }) {
  return (
    <div className="card px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold num ${
          tone === 'green' ? 'text-up' : tone === 'red' ? 'text-down' : 'text-ink'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

const STATUS_CHIP: Record<string, string> = {
  PENDING: 'badge-neutral',
  RUNNING: 'bg-info/10 text-info ring-info/25',
  COMPLETED: 'bg-up/10 text-up ring-up/25',
  FAILED: 'bg-down/10 text-down ring-down/25',
};

export default function BacktestDetailPage() {
  const t = useTranslations('backtests.detail');
  const tc = useTranslations('common');
  const { id } = useParams<{ id: string }>();

  const { data: backtest, isLoading, error } = useQuery({
    queryKey: ['backtest', id],
    queryFn: async () => (await api.backtest(id)).data as BacktestRow,
    refetchInterval: (q) => {
      const status = (q.state.data as BacktestRow | undefined)?.status;
      return status === 'PENDING' || status === 'RUNNING' ? 3000 : false;
    },
  });

  if (isLoading) return <Spinner />;
  if (error || !backtest) return <ErrorBanner message={(error as any)?.message || t('notFound')} />;

  const m = backtest.results?.metrics;
  const curve = (backtest.results?.equityCurve || []).map((p) => ({
    timestamp: new Date(p.timestamp).toISOString(),
    value: Number(p.equity),
  }));
  const warnings = backtest.results?.warnings || [];
  const progressHint =
    backtest.status === 'PENDING'
      ? t('queued')
      : backtest.status === 'RUNNING'
        ? t('running')
        : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-ink">{backtest.name}</h2>
            <span className={`badge ${STATUS_CHIP[backtest.status] || STATUS_CHIP.PENDING}`}>
              {backtest.status === 'RUNNING' && <span className="glow-dot bg-info animate-pulse-dot" />}
              {tc(`backtestStatus.${backtest.status}` as 'PENDING')}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-ink-dim num leading-relaxed">
            {t('metaLine', {
              symbol: backtest.symbol,
              resolution: backtest.resolution,
              from: fmtDate(backtest.dateFrom),
              to: fmtDate(backtest.dateTo),
              processed: backtest.results?.candlesProcessed ?? tc('dash'),
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/backtests" className="btn-secondary btn-md">
            <span className="rtl-flip" aria-hidden>←</span>
            {t('allBacktests')}
          </Link>
          {backtest.status === 'COMPLETED' && (
            <Button
              variant="secondary"
              onClick={() =>
                void downloadWithAuth(
                  `/api/backtests/${backtest.id}/trades.csv`,
                  `backtest-${backtest.id.slice(0, 8)}-trades.csv`,
                )
              }
            >
              {t('exportCsv')}
            </Button>
          )}
        </div>
      </div>

      {progressHint && <Notice tone="info" message={progressHint} />}

      {backtest.status === 'FAILED' && (
        <ErrorBanner message={backtest.error || t('failedDefault')} />
      )}

      {warnings.length > 0 && (
        <div className="rounded-lg border border-warn/25 bg-warn/[0.06] px-4 py-3">
          <p className="text-sm font-semibold text-warn mb-1">{t('warningsTitle')}</p>
          <ul className="list-disc list-inside text-sm text-warn/90 space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {m && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <Metric
              label={t('mTotalPnl')}
              value={`${Number(m.totalPnL) >= 0 ? '+' : ''}${fmtNum(m.totalPnL, 4)}`}
              tone={Number(m.totalPnL) >= 0 ? 'green' : 'red'}
            />
            <Metric label={t('mGridProfit')} value={`${fmtNum(m.gridProfitPct, 2)}%`} tone={Number(m.gridProfitPct) >= 0 ? 'green' : 'red'} />
            <Metric label={t('mBuyHold')} value={`${fmtNum(m.buyAndHoldPct, 2)}%`} />
            <Metric label={t('mMaxDrawdown')} value={`${fmtNum(m.maxDrawdownPct, 2)}%`} tone="red" />
            <Metric label={t('mWinRate')} value={`${fmtNum(m.winRatePct, 1)}%`} />
            <Metric label={t('mFeesPaid')} value={fmtNum(m.totalFees, 4)} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label={t('mRealizedPnl')} value={fmtNum(m.finalRealizedPnL, 4)} />
            <Metric label={t('mUnrealizedPnl')} value={fmtNum(m.finalUnrealizedPnL, 4)} />
            <Metric label={t('mBuysSells')} value={`${m.totalBuys} / ${m.totalSells}`} />
            <Metric label={t('mGridCycles')} value={String(m.gridCycles)} />
          </div>
        </>
      )}

      <Card>
        <CardHeader title={t('equityTitle')} />
        <div className="p-4">
          <EquityChart points={curve} label={t('equityLabel')} height={320} />
        </div>
      </Card>

      <Card>
        <CardHeader title={t('tradesTitle', { count: (backtest.trades || []).length })} />
        {(backtest.trades || []).length === 0 ? (
          <EmptyState message={t('noTrades')} />
        ) : (
          <div className="table-wrap max-h-[480px] overflow-y-auto">
            <table className="table">
              <thead className="sticky top-0 bg-panel z-10">
                <tr>
                  <th>{t('thTime')}</th>
                  <th>{t('thSide')}</th>
                  <th className="text-end">{t('thPrice')}</th>
                  <th className="text-end">{t('thQuantity')}</th>
                  <th className="text-end">{t('thFee')}</th>
                  <th className="text-end">{t('thCyclePnl')}</th>
                </tr>
              </thead>
              <tbody>
                {(backtest.trades || []).map((tr) => (
                  <tr key={tr.id}>
                    <td className="text-ink-dim">{fmtDate(tr.timestamp)}</td>
                    <td><SideBadge side={tr.side} /></td>
                    <td className="text-end font-mono num">{fmtNum(tr.price, 8)}</td>
                    <td className="text-end num">{fmtNum(tr.quantity, 8)}</td>
                    <td className="text-end num">{fmtNum(tr.fee, 8)}</td>
                    <td
                      className={`text-end num ${
                        Number(tr.pnl) > 0 ? 'text-up' : Number(tr.pnl) < 0 ? 'text-down' : ''
                      }`}
                    >
                      {fmtNum(tr.pnl, 6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
