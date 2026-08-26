'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { api } from '../../../../lib/api';
import { fmtDate, fmtNum } from '../../../../lib/format';
import { ErrorBanner, Spinner } from '../../../../components/ui';

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
        <Link href="/dashboard/backtests" className="text-sm text-blue-600 hover:underline">
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Backtest Comparison</h2>
          <p className="mt-1 text-sm text-gray-500">{rows.length} runs side by side</p>
        </div>
        <Link
          href="/dashboard/backtests"
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
        >
          ← All backtests
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-3">Metric</th>
              {rows.map((r) => (
                <th key={r.id} className="px-6 py-3">
                  <Link href={`/dashboard/backtests/${r.id}`} className="text-blue-600 hover:underline">
                    {r.name}
                  </Link>
                  <div className="font-normal normal-case text-gray-400 mt-0.5">
                    {r.symbol} · {r.resolution} · {fmtDate(r.dateFrom)} → {fmtDate(r.dateTo)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            <tr>
              <td className="px-6 py-3 text-gray-500">Status</td>
              {rows.map((r) => (
                <td key={r.id} className="px-6 py-3">
                  {r.status} · {r.tradeCount} trades
                </td>
              ))}
            </tr>
            {METRIC_ROWS.map(({ label, key, suffix, betterHigh }) => {
              const bi = bestIndex(key, betterHigh);
              return (
                <tr key={key}>
                  <td className="px-6 py-3 text-gray-500">{label}</td>
                  {rows.map((r, i) => {
                    const raw = r.results?.metrics?.[key];
                    const val = raw === undefined ? null : Number(raw);
                    return (
                      <td
                        key={r.id}
                        className={`px-6 py-3 ${
                          i === bi && rows.length > 1 && val !== null
                            ? 'font-semibold text-green-700 bg-green-50'
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
      </div>
      <p className="text-xs text-gray-400">
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
