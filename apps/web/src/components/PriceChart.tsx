'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { createChart, ColorType, LineStyle, type IChartApi } from 'lightweight-charts';
import { themeColor, useTheme } from '../lib/theme';

export interface ChartCandle {
  timestamp: string; // ISO
  open: string;
  high: string;
  low: string;
  close: string;
}

/**
 * Candlestick chart with grid-level price lines.
 *
 * RTL note: the chart canvas is deliberately kept LTR (`dir="ltr"`). Charting
 * libraries (lightweight-charts) do not natively support mirrored rendering;
 * time-series charts conventionally read left-to-right even in RTL UIs. All
 * surrounding titles/labels outside the canvas are RTL-aware. See
 * docs/ASSUMPTIONS.md.
 */
export function PriceChart({
  candles,
  gridLevels = [],
  height = 380,
}: {
  candles: ChartCandle[];
  gridLevels?: Array<{ price: string; active?: boolean }>;
  height?: number;
}) {
  const t = useTranslations('bots.detail');
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { theme } = useTheme();

  const candleKey = JSON.stringify(candles.map((c) => c.timestamp));
  const levelKey = JSON.stringify(gridLevels.map((g) => g.price));

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: themeColor('--ink-faint'),
      },
      grid: {
        vertLines: { color: themeColor('--edge-tint', 0.08) },
        horzLines: { color: themeColor('--edge-tint', 0.08) },
      },
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: themeColor('--edge-tint', 0.16) },
      rightPriceScale: { borderColor: themeColor('--edge-tint', 0.16) },
      autoSize: true,
    });
    chartRef.current = chart;

    const series = chart.addCandlestickSeries({
      upColor: themeColor('--up'),
      downColor: themeColor('--down'),
      borderVisible: false,
      wickUpColor: themeColor('--up'),
      wickDownColor: themeColor('--down'),
    });

    series.setData(
      candles.map((c) => ({
        time: Math.floor(new Date(c.timestamp).getTime() / 1000) as any,
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      })),
    );

    for (const lvl of gridLevels) {
      series.createPriceLine({
        price: Number(lvl.price),
        color: lvl.active ? themeColor('--accent') : themeColor('--edge-tint', 0.45),
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: false,
        title: '',
      });
    }

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candleKey, levelKey, height, theme]);

  if (candles.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-ink-faint text-center px-4" style={{ height }}>
        {t('noCandles')}
      </div>
    );
  }

  return <div ref={containerRef} dir="ltr" style={{ height }} />;
}
