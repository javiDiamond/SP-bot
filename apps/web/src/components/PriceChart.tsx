'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, LineStyle, type IChartApi } from 'lightweight-charts';

export interface ChartCandle {
  timestamp: string; // ISO
  open: string;
  high: string;
  low: string;
  close: string;
}

export function PriceChart({
  candles,
  gridLevels = [],
  height = 380,
}: {
  candles: ChartCandle[];
  gridLevels?: Array<{ price: string; active?: boolean }>;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#374151',
      },
      grid: {
        vertLines: { color: '#f3f4f6' },
        horzLines: { color: '#f3f4f6' },
      },
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#e5e7eb' },
      rightPriceScale: { borderColor: '#e5e7eb' },
      autoSize: true,
    });
    chartRef.current = chart;

    const series = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
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
        color: lvl.active ? '#3b82f6' : '#9ca3af',
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
  }, [JSON.stringify(candles.map((c) => c.timestamp)), JSON.stringify(gridLevels.map((g) => g.price)), height]);

  if (candles.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        No candle data yet — ingest candles from the exchange to draw the chart.
      </div>
    );
  }

  return <div ref={containerRef} style={{ height }} />;
}
