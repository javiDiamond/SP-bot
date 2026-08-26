'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { fmtDate, fmtNum } from '@/lib/format';
import { Card, ErrorBanner, PageHeader, Spinner } from '@/components/ui';

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

const METRIC_ROWS: Array<{ labelKey: string; key: string; suffix?: string; betterHigh: boolean }> = [
  { labelKey: 'mTotalPnl', key: 'totalPnL', betterHigh: true },
  { labelKey: 'mGridProfit', key: 'gridProfitPct', suffix: '%', betterHigh: true },
  { labelKey: 'mBuyHold', key: 'buyAndHoldPct', suffix: '%', betterHigh: true },
  { labelKey: 'mMaxDrawdown', key: 'maxDrawdownPct', suffix: '%', betterHigh: false },
  { labelKey: 'mWinRate', key: 'winRatePct', suffix: '%', betterHigh: true },
  { labelKey: 'mFeesPaid', key: 'totalFees', betterHigh: false },
  { labelKey: 'mBuys', key: 'totalBuys', betterHigh: true },
  { labelKey: 'mSells', key: 'totalSells', betterHigh: true },
  { labelKey: 'mGridCycles', key: 'gridCycles', betterHigh: true },
  { labelKey: 'mStartEquity', key: 'startEquity', betterHigh: true },
  { labelKey: 'mEndEquity', key: 'endEquity', betterHigh: true },
];

function CompareContent() {
  const t = useTranslations('backtests.compare');
  const tc = useTranslations('common');
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
        <ErrorBanner message={t('needMore')} />
        <Link href="/dashboard/backtests" className="link text-sm">
          <span className="rtl-flip" aria-hidden>←</span> {t('backLink')}
        </Link>
      </div>
    );
  }

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBanner message={(error as any)?.message || t('errCompareFailed')} />;

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
        title={t('title')}
        subtitle={t('subtitle', { count: rows.length })}
        actions={
          <Link href="/dashboard/backtests" className="btn-secondary btn-md">
            <span className="rtl-flip" aria-hidden>←</span>
            {t('backLink')}
          </Link>
        }
      />

      <Card className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t('thMetric')}</th>
              {rows.map((r) => (
                <th key={r.id}>
                  <Link href={`/dashboard/backtests/${r.id}`} className="link normal-case text-xs">
                    {r.name}
                  </Link>
                  <div className="font-normal normal-case text-ink-faint mt-1 num">
                    {r.symbol} · {r.resolution} · {fmtDate(r.dateFrom)} <span className="rtl-flip">→</span> {fmtDate(r.dateTo)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-ink-faint">{t('statusRow')}</td>
              {rows.map((r) => (
                <td key={r.id} className="text-ink-dim num">
                  {tc(`backtestStatus.${r.status}` as 'PENDING')} · {t('tradesCount', { count: r.tradeCount })}
                </td>
              ))}
            </tr>
            {METRIC_ROWS.map(({ labelKey, key, suffix, betterHigh }) => {
              const bi = bestIndex(key, betterHigh);
              return (
                <tr key={key}>
                  <td className="text-ink-faint">{t(labelKey)}</td>
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
                        {val === null || !Number.isFinite(val) ? tc('dash') : `${fmtNum(val, 4)}${suffix || ''}`}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-ink-faint leading-relaxed">{t('hint')}</p>
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
