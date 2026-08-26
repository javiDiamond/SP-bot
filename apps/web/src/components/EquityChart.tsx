'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslations } from 'next-intl';
import { themeColor, useTheme } from '../lib/theme';
import { fmtAxisTime, fmtNum } from '../lib/format';

/**
 * Equity/PnL area chart.
 *
 * RTL note: the chart canvas is deliberately kept LTR (`dir="ltr"`) — see
 * PriceChart.tsx and docs/ASSUMPTIONS.md. Axis labels, tooltips and values are
 * formatted locale-aware with Latin digits (financial figures).
 */
export function EquityChart({
  points,
  valueKey = 'totalPnL',
  label = 'Total PnL',
  height = 280,
  emptyText,
}: {
  points: Array<{ timestamp: string; value: number }>;
  valueKey?: string;
  label?: string;
  height?: number;
  emptyText?: string;
}) {
  const { theme } = useTheme();
  const t = useTranslations('bots.detail');

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-ink-faint text-center px-4" style={{ height }}>
        {emptyText ?? t('noSnapshots')}
      </div>
    );
  }

  const data = [...points]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((p) => ({
      t: fmtAxisTime(p.timestamp),
      [valueKey]: p.value,
    }));

  return (
    <div dir="ltr">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`equityGradient-${theme}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={themeColor('--accent')} stopOpacity={0.28} />
              <stop offset="95%" stopColor={themeColor('--accent')} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={themeColor('--edge-tint', 0.10)} />
          <XAxis dataKey="t" tick={{ fontSize: 11, fill: themeColor('--ink-faint') }} minTickGap={40} />
          <YAxis tick={{ fontSize: 11, fill: themeColor('--ink-faint') }} width={70} />
          <Tooltip
            formatter={(value: any) => [fmtNum(value, 4), label]}
            contentStyle={{
              fontSize: 12,
              background: themeColor('--panel'),
              border: `1px solid ${themeColor('--edge-tint', 0.18)}`,
              borderRadius: 8,
              color: themeColor('--ink'),
            }}
            labelStyle={{ color: themeColor('--ink-dim') }}
            itemStyle={{ color: themeColor('--ink') }}
          />
          <Area
            type="monotone"
            dataKey={valueKey}
            stroke={themeColor('--accent')}
            strokeWidth={2}
            fill={`url(#equityGradient-${theme})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
