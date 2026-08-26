'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api, downloadWithAuth } from '../../../../lib/api';
import { fmtDate, fmtNum } from '../../../../lib/format';
import { Button, EmptyState, ErrorBanner, SideBadge, Spinner } from '../../../../components/ui';
import { EquityChart } from '../../../../components/EquityChart';
import type { BacktestRow } from '../../../../lib/types';

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'red' }) {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={`text-lg font-semibold ${
          tone === 'green' ? 'text-green-600' : tone === 'red' ? 'text-red-600' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function BacktestDetailPage() {
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
  if (error || !backtest) return <ErrorBanner message={(error as any)?.message || 'Backtest not found'} />;

  const m = backtest.results?.metrics;
  const curve = (backtest.results?.equityCurve || []).map((p) => ({
    timestamp: new Date(p.timestamp).toISOString(),
    value: Number(p.equity),
  }));
  const warnings = backtest.results?.warnings || [];
  const progressHint =
    backtest.status === 'PENDING'
      ? 'Queued — waiting for a worker…'
      : backtest.status === 'RUNNING'
        ? 'Running simulation…'
        : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{backtest.name}</h2>
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                backtest.status === 'COMPLETED'
                  ? 'bg-green-50 text-green-700'
                  : backtest.status === 'FAILED'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-blue-50 text-blue-700'
              }`}
            >
              {backtest.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {backtest.symbol} · {backtest.resolution} candles · {fmtDate(backtest.dateFrom)} →{' '}
            {fmtDate(backtest.dateTo)} · {backtest.results?.candlesProcessed ?? '—'} candles
            processed
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/backtests"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
          >
            ← All backtests
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
              Export trades CSV
            </Button>
          )}
        </div>
      </div>

      {progressHint && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-md text-sm text-blue-700">
          {progressHint}
        </div>
      )}

      {backtest.status === 'FAILED' && (
        <ErrorBanner message={backtest.error || 'Backtest failed without an error message'} />
      )}

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <p className="text-sm font-medium text-yellow-800 mb-1">Data quality warnings</p>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {m && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Metric
              label="Total PnL"
              value={`${Number(m.totalPnL) >= 0 ? '+' : ''}${fmtNum(m.totalPnL, 4)}`}
              tone={Number(m.totalPnL) >= 0 ? 'green' : 'red'}
            />
            <Metric label="Grid profit" value={`${fmtNum(m.gridProfitPct, 2)}%`} tone={Number(m.gridProfitPct) >= 0 ? 'green' : 'red'} />
            <Metric label="Buy & hold" value={`${fmtNum(m.buyAndHoldPct, 2)}%`} />
            <Metric label="Max drawdown" value={`${fmtNum(m.maxDrawdownPct, 2)}%`} tone="red" />
            <Metric label="Win rate" value={`${fmtNum(m.winRatePct, 1)}%`} />
            <Metric label="Fees paid" value={fmtNum(m.totalFees, 4)} />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Realized PnL" value={fmtNum(m.finalRealizedPnL, 4)} />
            <Metric label="Unrealized PnL" value={fmtNum(m.finalUnrealizedPnL, 4)} />
            <Metric label="Buys / Sells" value={`${m.totalBuys} / ${m.totalSells}`} />
            <Metric label="Grid cycles" value={String(m.gridCycles)} />
          </div>
        </>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Equity curve</h3>
        </div>
        <div className="p-4">
          <EquityChart points={curve} label="Equity" height={320} />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Trades ({(backtest.trades || []).length})
          </h3>
        </div>
        {(backtest.trades || []).length === 0 ? (
          <EmptyState message="No trades recorded." />
        ) : (
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase sticky top-0">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Side</th>
                  <th className="px-6 py-3 text-right">Price</th>
                  <th className="px-6 py-3 text-right">Quantity</th>
                  <th className="px-6 py-3 text-right">Fee</th>
                  <th className="px-6 py-3 text-right">Cycle PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {(backtest.trades || []).map((t) => (
                  <tr key={t.id}>
                    <td className="px-6 py-2 text-gray-500">{fmtDate(t.timestamp)}</td>
                    <td className="px-6 py-2"><SideBadge side={t.side} /></td>
                    <td className="px-6 py-2 text-right font-mono">{fmtNum(t.price, 8)}</td>
                    <td className="px-6 py-2 text-right">{fmtNum(t.quantity, 8)}</td>
                    <td className="px-6 py-2 text-right">{fmtNum(t.fee, 8)}</td>
                    <td
                      className={`px-6 py-2 text-right ${
                        Number(t.pnl) > 0 ? 'text-green-600' : Number(t.pnl) < 0 ? 'text-red-600' : ''
                      }`}
                    >
                      {fmtNum(t.pnl, 6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
