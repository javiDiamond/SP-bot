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

export function EquityChart({
  points,
  valueKey = 'totalPnL',
  label = 'Total PnL',
  height = 280,
}: {
  points: Array<{ timestamp: string; value: number }>;
  valueKey?: string;
  label?: string;
  height?: number;
}) {
  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-ink-faint" style={{ height }}>
        No snapshot data yet — PnL snapshots are recorded while the bot runs.
      </div>
    );
  }

  const data = [...points]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((p) => ({
      t: new Date(p.timestamp).toLocaleTimeString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      [valueKey]: p.value,
    }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2DD4A0" stopOpacity={0.28} />
            <stop offset="95%" stopColor="#2DD4A0" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.10)" />
        <XAxis dataKey="t" tick={{ fontSize: 11, fill: '#5C6879' }} minTickGap={40} />
        <YAxis tick={{ fontSize: 11, fill: '#5C6879' }} width={70} />
        <Tooltip
          formatter={(value: any) => [Number(value).toFixed(4), label]}
          contentStyle={{
            fontSize: 12,
            background: '#131B27',
            border: '1px solid rgba(148,163,184,0.18)',
            borderRadius: 8,
            color: '#E8EDF5',
          }}
          labelStyle={{ color: '#97A3B6' }}
          itemStyle={{ color: '#E8EDF5' }}
        />
        <Area
          type="monotone"
          dataKey={valueKey}
          stroke="#2DD4A0"
          strokeWidth={2}
          fill="url(#equityGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
