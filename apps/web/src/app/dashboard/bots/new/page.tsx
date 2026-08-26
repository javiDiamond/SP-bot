'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../lib/api';
import { generateGridLevels, gridProfit, spacingInfo } from '../../../../lib/grid';
import { fmtNum } from '../../../../lib/format';
import { Button, Card, CardHeader, ErrorBanner } from '../../../../components/ui';
import type { ExchangeAccountRow, MarketRow } from '../../../../lib/types';

const DEFAULT_FEE = '0.002'; // 0.2% assumed maker/taker for preview

const RANGE_EXIT_OPTIONS = [
  { value: 'PAUSE_KEEP_ORDERS', label: 'Pause & keep orders' },
  { value: 'PAUSE_CANCEL_ALL', label: 'Pause & cancel all' },
  { value: 'STOP_CANCEL_ALL', label: 'Stop & cancel all' },
  { value: 'RECENTER', label: 'Recenter grid on price' },
  { value: 'TRAILING', label: 'Trailing (shift range)' },
];

export default function NewBotPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    symbol: '',
    mode: 'DRY_RUN' as 'DRY_RUN' | 'LIVE',
    exchangeAccountId: '',
    gridType: 'ARITHMETIC' as 'ARITHMETIC' | 'GEOMETRIC',
    lowerPrice: '',
    upperPrice: '',
    gridCount: '10',
    totalInvestmentQuote: '100',
    inventoryMode: 'AUTO_REBALANCE' as 'EXISTING_ONLY' | 'AUTO_REBALANCE' | 'MANUAL',
    makerOnly: true,
    minProfitAfterFeesBps: '10',
    onRangeExit: 'PAUSE_KEEP_ORDERS',
    stopLossPrice: '',
    takeProfitPrice: '',
  });
  const [symbolQuery, setSymbolQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: markets } = useQuery({
    queryKey: ['markets'],
    queryFn: async () => (await api.markets()).data as MarketRow[],
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.accounts()).data as ExchangeAccountRow[],
  });

  const filteredMarkets = useMemo(() => {
    const list = (markets || []).filter((m) => m.isSpot !== false);
    const q = symbolQuery.trim().toUpperCase();
    if (!q) return list.slice(0, 50);
    return list.filter((m) => m.symbol.includes(q) || m.baseAsset.includes(q)).slice(0, 50);
  }, [markets, symbolQuery]);

  const selectedMarket = useMemo(
    () => (markets || []).find((m) => m.symbol === form.symbol),
    [markets, form.symbol],
  );

  const ticker = useQuery({
    queryKey: ['ticker', form.symbol],
    queryFn: async () => (await api.ticker(form.symbol)).data,
    enabled: Boolean(form.symbol) && !selectedMarket?.lastPrice,
    refetchInterval: 30_000,
  });

  const currentPrice = useMemo(() => {
    if (selectedMarket?.lastPrice) return String(selectedMarket.lastPrice);
    return ticker.data?.lastPrice || '';
  }, [selectedMarket, ticker.data]);

  const precision = selectedMarket?.pricePrecision ?? 8;

  const preview = useMemo(() => {
    const lower = Number(form.lowerPrice);
    const upper = Number(form.upperPrice);
    const count = Number(form.gridCount);
    if (!(lower > 0) || !(upper > 0) || lower >= upper || !(count >= 2)) return null;
    try {
      const levels = generateGridLevels({
        gridType: form.gridType,
        lowerPrice: form.lowerPrice,
        upperPrice: form.upperPrice,
        gridCount: count,
        pricePrecision: precision,
      });
      const spacing = spacingInfo(levels, form.gridType);
      const profit =
        levels.length >= 2
          ? gridProfit(levels[0].price, levels[1].price, DEFAULT_FEE, DEFAULT_FEE)
          : null;
      const perGrid =
        Number(form.totalInvestmentQuote) > 0 ? Number(form.totalInvestmentQuote) / count : 0;
      return { levels, spacing, profit, perGrid };
    } catch {
      return null;
    }
  }, [form.lowerPrice, form.upperPrice, form.gridCount, form.gridType, precision, form.totalInvestmentQuote]);

  const minProfitBps = Number(form.minProfitAfterFeesBps) || 0;
  const netPct = preview?.profit ? Number(preview.profit.netPct) : 0;
  const profitTooLow = preview?.profit !== null && preview?.profit !== undefined && netPct < minProfitBps / 100;

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Bot name is required');
    if (!form.symbol) return setError('Select a market symbol');
    const lower = Number(form.lowerPrice);
    const upper = Number(form.upperPrice);
    if (!(lower > 0) || !(upper > 0) || lower >= upper)
      return setError('Lower price must be positive and less than upper price');
    if (Number(form.gridCount) < 2) return setError('Grid count must be at least 2');
    if (form.mode === 'LIVE' && !form.exchangeAccountId)
      return setError('Live bots require an exchange account');

    setBusy(true);
    try {
      const res = await api.createBot({
        name: form.name.trim(),
        symbol: form.symbol,
        strategyType: 'GRID',
        mode: form.mode,
        exchangeAccountId: form.exchangeAccountId || undefined,
        gridConfig: {
          gridType: form.gridType,
          lowerPrice: form.lowerPrice,
          upperPrice: form.upperPrice,
          gridCount: Number(form.gridCount),
          totalInvestmentQuote: form.totalInvestmentQuote || undefined,
          inventoryMode: form.inventoryMode,
          makerOnly: form.makerOnly,
          minProfitAfterFeesBps: Number(form.minProfitAfterFeesBps) || 0,
          onRangeExit: form.onRangeExit,
          autoRecenter: form.onRangeExit === 'RECENTER',
          stopLossPrice: form.stopLossPrice || undefined,
          takeProfitPrice: form.takeProfitPrice || undefined,
          allowMarketOrders: false,
        },
      });
      router.push(`/dashboard/bots/${res.data?.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create bot');
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Create Grid Bot</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure a spot grid strategy. Dry-run bots simulate fills locally; LIVE bots require
          explicit enablement.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="1. Basics" />
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bot name</label>
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="BTCUSDT conservative grid"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trading mode
                  </label>
                  <select
                    value={form.mode}
                    onChange={(e) => set('mode', e.target.value as 'DRY_RUN' | 'LIVE')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="DRY_RUN">DRY RUN (paper trading)</option>
                    <option value="LIVE">LIVE (real orders)</option>
                  </select>
                  {form.mode === 'LIVE' && (
                    <p className="mt-1 text-xs text-red-600">
                      Live trading is blocked unless the environment flag, global risk setting, and
                      account live flag are all enabled.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exchange account {form.mode === 'LIVE' ? '(required)' : '(optional)'}
                  </label>
                  <select
                    value={form.exchangeAccountId}
                    onChange={(e) => set('exchangeAccountId', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">— none —</option>
                    {(accounts || []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.apiKeyMasked}){a.isLiveEnabled ? ' · LIVE' : ''}
                      </option>
                    ))}
                  </select>
                  {(accounts || []).length === 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      No accounts yet.{' '}
                      <Link href="/dashboard/exchange" className="text-blue-600 hover:underline">
                        Add one
                      </Link>{' '}
                      to track balances or trade live.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Market</label>
                <input
                  value={symbolQuery}
                  onChange={(e) => setSymbolQuery(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Filter markets, e.g. BTC or USDT…"
                />
                <select
                  value={form.symbol}
                  onChange={(e) => set('symbol', e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  size={6}
                >
                  <option value="">— select market —</option>
                  {filteredMarkets.map((m) => (
                    <option key={m.symbol} value={m.symbol}>
                      {m.symbol} — {m.baseAsset}/{m.quoteAsset}
                      {m.lastPrice ? ` @ ${fmtNum(m.lastPrice, 6)}` : ''}
                    </option>
                  ))}
                </select>
                {selectedMarket && (
                  <p className="mt-1 text-xs text-gray-500">
                    price precision {selectedMarket.pricePrecision} · amount precision{' '}
                    {selectedMarket.amountPrecision}
                    {selectedMarket.minNotional ? ` · min notional ${fmtNum(selectedMarket.minNotional)}` : ''}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="2. Grid parameters" />
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grid type</label>
                  <select
                    value={form.gridType}
                    onChange={(e) => set('gridType', e.target.value as 'ARITHMETIC' | 'GEOMETRIC')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="ARITHMETIC">Arithmetic (equal spacing)</option>
                    <option value="GEOMETRIC">Geometric (equal %)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grid count</label>
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={form.gridCount}
                    onChange={(e) => set('gridCount', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Investment ({selectedMarket?.quoteAsset || 'quote'})
                  </label>
                  <input
                    value={form.totalInvestmentQuote}
                    onChange={(e) => set('totalInvestmentQuote', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Total quote amount"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lower price</label>
                  <input
                    value={form.lowerPrice}
                    onChange={(e) => set('lowerPrice', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upper price</label>
                  <input
                    value={form.upperPrice}
                    onChange={(e) => set('upperPrice', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              {currentPrice && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  Current price: <strong>{fmtNum(currentPrice, 6)}</strong>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const p = Number(currentPrice);
                      if (p > 0) {
                        set('lowerPrice', (p * 0.95).toPrecision(6));
                        set('upperPrice', (p * 1.05).toPrecision(6));
                      }
                    }}
                  >
                    ±5% around price
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inventory mode</label>
                  <select
                    value={form.inventoryMode}
                    onChange={(e) =>
                      set('inventoryMode', e.target.value as 'EXISTING_ONLY' | 'AUTO_REBALANCE' | 'MANUAL')
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="AUTO_REBALANCE">Auto rebalance</option>
                    <option value="EXISTING_ONLY">Existing balance only</option>
                    <option value="MANUAL">Manual amounts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min profit/grid (bps)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.minProfitAfterFeesBps}
                    onChange={(e) => set('minProfitAfterFeesBps', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">On range exit</label>
                  <select
                    value={form.onRangeExit}
                    onChange={(e) => set('onRangeExit', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    {RANGE_EXIT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stop-loss price <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    value={form.stopLossPrice}
                    onChange={(e) => set('stopLossPrice', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Take-profit price <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    value={form.takeProfitPrice}
                    onChange={(e) => set('takeProfitPrice', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.makerOnly}
                      onChange={(e) => set('makerOnly', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Maker-only orders
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Grid preview" />
            <div className="p-6 space-y-4 text-sm">
              {!preview ? (
                <p className="text-gray-500">
                  Enter a valid lower price, upper price, and grid count to preview the levels.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-xs text-gray-500">Levels</p>
                      <p className="font-semibold">{preview.levels.length}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-xs text-gray-500">Per-grid quote</p>
                      <p className="font-semibold">{fmtNum(preview.perGrid, 4)}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-xs text-gray-500">Avg spacing</p>
                      <p className="font-semibold">{preview.spacing.avgSpacingPct}%</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-xs text-gray-500">Net profit/grid</p>
                      <p
                        className={`font-semibold ${
                          preview.profit?.isProfitable ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {preview.profit?.netPct}%
                      </p>
                    </div>
                  </div>

                  {preview.profit && !preview.profit.isProfitable && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded text-red-700">
                      Grid spacing is smaller than round-trip fees (assumed 0.4%). This grid will
                      lose money per cycle.
                    </div>
                  )}
                  {profitTooLow && preview.profit?.isProfitable && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded text-yellow-700">
                      Net profit/grid is below your configured minimum of {minProfitBps} bps.
                    </div>
                  )}
                  {currentPrice &&
                    (Number(currentPrice) < Number(form.lowerPrice) ||
                      Number(currentPrice) > Number(form.upperPrice)) && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded text-blue-700">
                        Current price is outside the grid range; orders will only be placed once
                        the price enters the range.
                      </div>
                    )}

                  <div className="max-h-64 overflow-y-auto border rounded">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50 text-left text-gray-500">
                        <tr>
                          <th className="px-3 py-1.5">#</th>
                          <th className="px-3 py-1.5 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {[...preview.levels].reverse().map((lvl) => (
                          <tr
                            key={lvl.levelIndex}
                            className={
                              currentPrice &&
                              Number(lvl.price) <= Number(currentPrice) &&
                              lvl.levelIndex ===
                                preview.levels.reduce(
                                  (best, l) =>
                                    Number(l.price) <= Number(currentPrice) &&
                                    Number(l.price) > Number(best.price)
                                      ? l
                                      : best,
                                  preview.levels[0],
                                ).levelIndex
                                ? 'bg-yellow-50'
                                : ''
                            }
                          >
                            <td className="px-3 py-1">{lvl.levelIndex}</td>
                            <td className="px-3 py-1 text-right font-mono">{lvl.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={busy} variant="primary">
              {busy ? 'Creating…' : 'Create bot'}
            </Button>
            <Link
              href="/dashboard/bots"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
