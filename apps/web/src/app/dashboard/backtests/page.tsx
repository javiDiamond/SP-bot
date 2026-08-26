'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { fmtDate } from '../../../lib/format';
import { Button, EmptyState, ErrorBanner, Spinner } from '../../../components/ui';
import type { BacktestRow, MarketRow } from '../../../lib/types';
import { useRouter } from 'next/navigation';

const RESOLUTIONS = [
  { value: '1', label: '1 minute' },
  { value: '15', label: '15 minutes' },
  { value: '60', label: '1 hour' },
  { value: '240', label: '4 hours' },
  { value: '720', label: '12 hours' },
  { value: '1D', label: '1 day' },
];

function statusChip(status: string) {
  const map: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-600',
    RUNNING: 'bg-blue-50 text-blue-700',
    COMPLETED: 'bg-green-50 text-green-700',
    FAILED: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${map[status] || map.PENDING}`}>
      {status}
    </span>
  );
}

export default function BacktestsPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    name: '',
    symbol: '',
    resolution: '60',
    dateFrom: '',
    dateTo: '',
    gridType: 'ARITHMETIC',
    lowerPrice: '',
    upperPrice: '',
    gridCount: '10',
    totalInvestmentQuote: '100',
    makerFee: '0.001',
    takerFee: '0.001',
    makerOnly: true,
  });

  const { data: backtests, isLoading } = useQuery({
    queryKey: ['backtests'],
    queryFn: async () => (await api.backtests()).data as BacktestRow[],
    refetchInterval: 8000,
  });

  const { data: markets } = useQuery({
    queryKey: ['markets'],
    queryFn: async () => (await api.markets()).data as MarketRow[],
  });

  const set = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) return setFormError('Name is required');
    if (!form.symbol) return setFormError('Select a market');
    if (!form.dateFrom || !form.dateTo) return setFormError('Select a date range');
    const lower = Number(form.lowerPrice);
    const upper = Number(form.upperPrice);
    if (!(lower > 0) || lower >= upper) return setFormError('Invalid price range');

    setBusy(true);
    try {
      const from = new Date(form.dateFrom);
      const to = new Date(form.dateTo);
      if (from >= to) throw new Error('dateFrom must be before dateTo');

      const res = await api.createBacktest({
        name: form.name.trim(),
        symbol: form.symbol,
        dateFrom: from.toISOString(),
        dateTo: to.toISOString(),
        resolution: form.resolution,
        config: {
          gridType: form.gridType,
          lowerPrice: form.lowerPrice,
          upperPrice: form.upperPrice,
          gridCount: Number(form.gridCount),
          totalInvestmentQuote: form.totalInvestmentQuote,
          inventoryMode: 'AUTO_REBALANCE',
          makerOnly: form.makerOnly,
          minProfitAfterFeesBps: 0,
          onRangeExit: 'PAUSE_KEEP_ORDERS',
          autoRecenter: false,
          allowMarketOrders: false,
        },
        feeOverrides: {
          makerFeeRate: form.makerFee,
          takerFeeRate: form.takerFee,
        },
      });
      setShowForm(false);
      router.push(`/dashboard/backtests/${res.data?.id}`);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create backtest');
      setBusy(false);
    }
  };

  const toggleSelected = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-5)));

  const compare = async () => {
    setError('');
    try {
      await api.compareBacktests(selected); // validates 2-5 server-side
      router.push(`/dashboard/backtests/compare?ids=${selected.join(',')}`);
    } catch (err: any) {
      setError(err?.message || 'Compare failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Backtests</h2>
          <p className="mt-1 text-sm text-gray-500">
            Run grid strategies on historical candles. Missing candle data is fetched from Wallex
            automatically when a run starts.
          </p>
        </div>
        <div className="flex gap-2">
          {selected.length >= 2 && (
            <Button variant="secondary" onClick={compare}>
              Compare ({selected.length})
            </Button>
          )}
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Close form' : 'New backtest'}
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {showForm && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">New backtest</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {formError && <ErrorBanner message={formError} />}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Market</label>
                <select
                  value={form.symbol}
                  onChange={(e) => set('symbol', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">— select —</option>
                  {(markets || [])
                    .filter((m) => m.isSpot !== false)
                    .map((m) => (
                      <option key={m.symbol} value={m.symbol}>
                        {m.symbol}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                <select
                  value={form.resolution}
                  onChange={(e) => set('resolution', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {RESOLUTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="datetime-local"
                  value={form.dateFrom}
                  onChange={(e) => set('dateFrom', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="datetime-local"
                  value={form.dateTo}
                  onChange={(e) => set('dateTo', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grid type</label>
                <select
                  value={form.gridType}
                  onChange={(e) => set('gridType', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="ARITHMETIC">Arithmetic</option>
                  <option value="GEOMETRIC">Geometric</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lower price</label>
                <input
                  value={form.lowerPrice}
                  onChange={(e) => set('lowerPrice', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upper price</label>
                <input
                  value={form.upperPrice}
                  onChange={(e) => set('upperPrice', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grids</label>
                <input
                  type="number"
                  min={2}
                  value={form.gridCount}
                  onChange={(e) => set('gridCount', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Investment</label>
                <input
                  value={form.totalInvestmentQuote}
                  onChange={(e) => set('totalInvestmentQuote', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maker fee</label>
                <input
                  value={form.makerFee}
                  onChange={(e) => set('makerFee', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="0.001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taker fee</label>
                <input
                  value={form.takerFee}
                  onChange={(e) => set('takerFee', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="0.001"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
                <input
                  type="checkbox"
                  checked={form.makerOnly}
                  onChange={(e) => set('makerOnly', e.target.checked)}
                  className="rounded border-gray-300"
                />
                Maker-only fills
              </label>
              <Button type="submit" disabled={busy}>
                {busy ? 'Submitting…' : 'Run backtest'}
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              If candles for this market/resolution/window haven’t been ingested yet, the worker
              fetches them from Wallex automatically before running the simulation.
            </p>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        {isLoading ? (
          <Spinner />
        ) : (backtests || []).length === 0 ? (
          <EmptyState message="No backtests yet. Create one to evaluate a grid strategy." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3 w-8"></th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Symbol</th>
                  <th className="px-6 py-3">Range</th>
                  <th className="px-6 py-3">Res</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Trades</th>
                  <th className="px-6 py-3 text-right">Total PnL</th>
                  <th className="px-6 py-3 text-right">vs B&H</th>
                  <th className="px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {(backtests || []).map((bt) => {
                  const m = bt.results?.metrics;
                  const gridPct = m ? Number(m.gridProfitPct) : null;
                  const bhPct = m ? Number(m.buyAndHoldPct) : null;
                  const diff = gridPct !== null && bhPct !== null ? gridPct - bhPct : null;
                  return (
                    <tr key={bt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(bt.id)}
                          onChange={() => toggleSelected(bt.id)}
                          disabled={bt.status !== 'COMPLETED' && !selected.includes(bt.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <Link
                          href={`/dashboard/backtests/${bt.id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {bt.name}
                        </Link>
                      </td>
                      <td className="px-6 py-3 font-medium">{bt.symbol}</td>
                      <td className="px-6 py-3 text-xs text-gray-500">
                        {fmtDate(bt.dateFrom)} → {fmtDate(bt.dateTo)}
                      </td>
                      <td className="px-6 py-3">{bt.resolution}</td>
                      <td className="px-6 py-3">{statusChip(bt.status)}</td>
                      <td className="px-6 py-3 text-right">{bt.tradeCount ?? '—'}</td>
                      <td
                        className={`px-6 py-3 text-right font-medium ${
                          m && Number(m.totalPnL) > 0
                            ? 'text-green-600'
                            : m && Number(m.totalPnL) < 0
                              ? 'text-red-600'
                              : ''
                        }`}
                      >
                        {m ? Number(m.totalPnL).toFixed(4) : '—'}
                      </td>
                      <td
                        className={`px-6 py-3 text-right ${
                          diff !== null ? (diff >= 0 ? 'text-green-600' : 'text-red-600') : ''
                        }`}
                      >
                        {diff !== null ? `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%` : '—'}
                      </td>
                      <td className="px-6 py-3 text-gray-500">{fmtDate(bt.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
