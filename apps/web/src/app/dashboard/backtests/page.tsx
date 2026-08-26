'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { fmtDate } from '../../../lib/format';
import { Button, Card, CardHeader, EmptyState, ErrorBanner, PageHeader, Spinner } from '../../../components/ui';
import type { BacktestRow, MarketRow } from '../../../lib/types';

const RESOLUTIONS = [
  { value: '1', label: '1 minute' },
  { value: '15', label: '15 minutes' },
  { value: '60', label: '1 hour' },
  { value: '240', label: '4 hours' },
  { value: '720', label: '12 hours' },
  { value: '1D', label: '1 day' },
];

const STATUS_CHIP: Record<string, string> = {
  PENDING: 'badge-neutral',
  RUNNING: 'bg-info/10 text-info ring-info/25',
  COMPLETED: 'bg-up/10 text-up ring-up/25',
  FAILED: 'bg-down/10 text-down ring-down/25',
};

function statusChip(status: string) {
  return (
    <span className={`badge ${STATUS_CHIP[status] || STATUS_CHIP.PENDING}`}>
      {status === 'RUNNING' && <span className="glow-dot bg-info animate-pulse-dot" />}
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
      <PageHeader
        title="Backtests"
        subtitle="Run grid strategies on historical candles. Missing candle data is fetched from Wallex automatically when a run starts."
        actions={
          <>
            {selected.length >= 2 && (
              <Button variant="secondary" onClick={compare}>
                Compare ({selected.length})
              </Button>
            )}
            <Button onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Close form' : 'New backtest'}
            </Button>
          </>
        }
      />

      {error && <ErrorBanner message={error} />}

      {showForm && (
        <Card>
          <CardHeader title="New backtest" subtitle="Simulation parameters and fee assumptions" />
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {formError && <ErrorBanner message={formError} />}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="bt-name" className="label">Name</label>
                <input
                  id="bt-name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label htmlFor="bt-symbol" className="label">Market</label>
                <select
                  id="bt-symbol"
                  value={form.symbol}
                  onChange={(e) => set('symbol', e.target.value)}
                  className="select"
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
                <label htmlFor="bt-res" className="label">Resolution</label>
                <select
                  id="bt-res"
                  value={form.resolution}
                  onChange={(e) => set('resolution', e.target.value)}
                  className="select"
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
                <label htmlFor="bt-from" className="label">From</label>
                <input
                  id="bt-from"
                  type="datetime-local"
                  value={form.dateFrom}
                  onChange={(e) => set('dateFrom', e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label htmlFor="bt-to" className="label">To</label>
                <input
                  id="bt-to"
                  type="datetime-local"
                  value={form.dateTo}
                  onChange={(e) => set('dateTo', e.target.value)}
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <label htmlFor="bt-gridtype" className="label">Grid type</label>
                <select
                  id="bt-gridtype"
                  value={form.gridType}
                  onChange={(e) => set('gridType', e.target.value)}
                  className="select"
                >
                  <option value="ARITHMETIC">Arithmetic</option>
                  <option value="GEOMETRIC">Geometric</option>
                </select>
              </div>
              <div>
                <label htmlFor="bt-lower" className="label">Lower price</label>
                <input
                  id="bt-lower"
                  value={form.lowerPrice}
                  onChange={(e) => set('lowerPrice', e.target.value)}
                  className="input num"
                  required
                />
              </div>
              <div>
                <label htmlFor="bt-upper" className="label">Upper price</label>
                <input
                  id="bt-upper"
                  value={form.upperPrice}
                  onChange={(e) => set('upperPrice', e.target.value)}
                  className="input num"
                  required
                />
              </div>
              <div>
                <label htmlFor="bt-count" className="label">Grids</label>
                <input
                  id="bt-count"
                  type="number"
                  min={2}
                  value={form.gridCount}
                  onChange={(e) => set('gridCount', e.target.value)}
                  className="input num"
                />
              </div>
              <div>
                <label htmlFor="bt-invest" className="label">Investment</label>
                <input
                  id="bt-invest"
                  value={form.totalInvestmentQuote}
                  onChange={(e) => set('totalInvestmentQuote', e.target.value)}
                  className="input num"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label htmlFor="bt-makerfee" className="label">Maker fee</label>
                <input
                  id="bt-makerfee"
                  value={form.makerFee}
                  onChange={(e) => set('makerFee', e.target.value)}
                  className="input num"
                  placeholder="0.001"
                />
              </div>
              <div>
                <label htmlFor="bt-takerfee" className="label">Taker fee</label>
                <input
                  id="bt-takerfee"
                  value={form.takerFee}
                  onChange={(e) => set('takerFee', e.target.value)}
                  className="input num"
                  placeholder="0.001"
                />
              </div>
              <label className="flex items-center gap-2.5 text-sm text-ink-dim pb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.makerOnly}
                  onChange={(e) => set('makerOnly', e.target.checked)}
                  className="h-4 w-4 rounded border-edge-strong bg-deep accent-accent focus:ring-accent/40"
                />
                Maker-only fills
              </label>
              <Button type="submit" disabled={busy}>
                {busy ? 'Submitting…' : 'Run backtest'}
              </Button>
            </div>
            <p className="field-hint">
              If candles for this market/resolution/window haven’t been ingested yet, the worker
              fetches them from Wallex automatically before running the simulation.
            </p>
          </form>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <Spinner />
        ) : (backtests || []).length === 0 ? (
          <EmptyState message="No backtests yet. Create one to evaluate a grid strategy." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>Name</th>
                  <th>Symbol</th>
                  <th>Range</th>
                  <th>Res</th>
                  <th>Status</th>
                  <th className="text-right">Trades</th>
                  <th className="text-right">Total PnL</th>
                  <th className="text-right">vs B&H</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {(backtests || []).map((bt) => {
                  const m = bt.results?.metrics;
                  const gridPct = m ? Number(m.gridProfitPct) : null;
                  const bhPct = m ? Number(m.buyAndHoldPct) : null;
                  const diff = gridPct !== null && bhPct !== null ? gridPct - bhPct : null;
                  return (
                    <tr key={bt.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(bt.id)}
                          onChange={() => toggleSelected(bt.id)}
                          disabled={bt.status !== 'COMPLETED' && !selected.includes(bt.id)}
                          className="h-4 w-4 rounded border-edge-strong bg-deep accent-accent focus:ring-accent/40"
                        />
                      </td>
                      <td>
                        <Link href={`/dashboard/backtests/${bt.id}`} className="link font-medium">
                          {bt.name}
                        </Link>
                      </td>
                      <td className="font-medium text-ink">{bt.symbol}</td>
                      <td className="text-xs text-ink-dim">
                        {fmtDate(bt.dateFrom)} → {fmtDate(bt.dateTo)}
                      </td>
                      <td>{bt.resolution}</td>
                      <td>{statusChip(bt.status)}</td>
                      <td className="text-right num">{bt.tradeCount ?? '—'}</td>
                      <td
                        className={`text-right font-medium num ${
                          m && Number(m.totalPnL) > 0
                            ? 'text-up'
                            : m && Number(m.totalPnL) < 0
                              ? 'text-down'
                              : ''
                        }`}
                      >
                        {m ? Number(m.totalPnL).toFixed(4) : '—'}
                      </td>
                      <td
                        className={`text-right num ${
                          diff !== null ? (diff >= 0 ? 'text-up' : 'text-down') : ''
                        }`}
                      >
                        {diff !== null ? `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%` : '—'}
                      </td>
                      <td className="text-ink-dim">{fmtDate(bt.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
