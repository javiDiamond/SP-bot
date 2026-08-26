'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { api } from '../../../../lib/api';
import { fmtDate, fmtNum } from '../../../../lib/format';
import { Card, ErrorBanner, PageHeader, Spinner } from '../../../../components/ui';

interface CompareRow {
  id: string;
  name: string;
  symbol: string;
  dateFrom: string;
  dateTo: string;
  resolution: string;
  status: string;
  results?: {
    metrics?: Record<string, string | number>;
  } | null;
  tradeCount: number;
  createdAt: string;
}

const METRIC_ROWS: Array<{ label: string; key: string; suffix?: string; betterHigh: boolean }> = [
  { label: 'Total PnL (quote)', key: 'totalPnL', betterHigh: true },
  { label: 'Grid profit', key: 'gridProfitPct', suffix: '%', betterHigh: true },
  { label: 'Buy & hold', key: 'buyAndHoldPct', suffix: '%', betterHigh: true },
  { label: 'Max drawdown', key: 'maxDrawdownPct', suffix: '%', betterHigh: false },
  { label: 'Win rate', key: 'winRatePct', suffix: '%', betterHigh: true },
  { label: 'Fees paid', key: 'totalFees', betterHigh: false },
  { label: 'Buys', key: 'totalBuys', betterHigh: true },
  { label: 'Sells', key: 'totalSells', betterHigh: true },
  { label: 'Grid cycles', key: 'gridCycles', betterHigh: true },
  { label: 'Start equity', key: 'startEquity', betterHigh: true },
  { label: 'End equity', key: 'endEquity', betterHigh: true },
];

function CompareContent() {
  const params = useSearchParams();
  const ids = (params.get('ids') || '').split(',').filter(Boolean);

  const { data, isLoading, error } = useQuery({
    queryKey: ['backtests-compare', ids.join(',')],
    queryFn: async () => (await api.compareBacktests(ids)).data as CompareRow[],
    enabled: ids.length >= 2,
  });

  if (ids.length < 2) {
    return (
      <div className="space-y-4">
        <ErrorBanner message="Provide at least 2 backtest ids. Select rows on the backtests list, then click Compare." />
        <Link href="/dashboard/backtests" className="link text-sm">
          ← Back to backtests
        </Link>
      </div>
    );
  }

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBanner message={(error as any)?.message || 'Compare failed'} />;

  const rows = data || [];

  const bestIndex = (key: string, betterHigh: boolean): number => {
    let best = -1;
    let bestVal = betterHigh ? -Infinity : Infinity;
    rows.forEach((r, i) => {
      const v = Number(r.results?.metrics?.[key]);
      if (!Number.isFinite(v)) return;
      if (betterHigh ? v > bestVal : v < bestVal) {
        bestVal = v;
        best = i;
      }
    });
    return best;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backtest Comparison"
        subtitle={`${rows.length} runs side by side`}
        actions={
          <Link href="/dashboard/backtests" className="btn-secondary btn-md">
            ← All backtests
          </Link>
        }
      />

      <Card className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Metric</th>
              {rows.map((r) => (
                <th key={r.id}>
                  <Link href={`/dashboard/backtests/${r.id}`} className="link normal-case text-xs">
                    {r.name}
                  </Link>
                  <div className="font-normal normal-case text-ink-faint mt-1">
                    {r.symbol} · {r.resolution} · {fmtDate(r.dateFrom)} → {fmtDate(r.dateTo)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-ink-faint">Status</td>
              {rows.map((r) => (
                <td key={r.id} className="text-ink-dim">
                  {r.status} · {r.tradeCount} trades
                </td>
              ))}
            </tr>
            {METRIC_ROWS.map(({ label, key, suffix, betterHigh }) => {
              const bi = bestIndex(key, betterHigh);
              return (
                <tr key={key}>
                  <td className="text-ink-faint">{label}</td>
                  {rows.map((r, i) => {
                    const raw = r.results?.metrics?.[key];
                    const val = raw === undefined ? null : Number(raw);
                    return (
                      <td
                        key={r.id}
                        className={`num ${
                          i === bi && rows.length > 1 && val !== null
                            ? 'font-semibold text-up bg-up/[0.07]'
                            : ''
                        }`}
                      >
                        {val === null || !Number.isFinite(val) ? '—' : `${fmtNum(val, 4)}${suffix || ''}`}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-ink-faint">
        Highlighted cells mark the best value per row (green is better).
      </p>
    </div>
  );
}

export default function BacktestComparePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CompareContent />
    </Suspense>
  );
}
