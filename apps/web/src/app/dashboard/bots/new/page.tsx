'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../lib/api';
import { generateGridLevels, gridProfit, spacingInfo } from '../../../../lib/grid';
import { fmtNum } from '../../../../lib/format';
import { Button, Card, CardHeader, ErrorBanner, Notice, PageHeader } from '../../../../components/ui';
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

  const nearestLevelIndex = useMemo(() => {
    if (!preview || !currentPrice) return null;
    return preview.levels.reduce(
      (best, l) =>
        Number(l.price) <= Number(currentPrice) && Number(l.price) > Number(best.price) ? l : best,
      preview.levels[0],
    ).levelIndex;
  }, [preview, currentPrice]);

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Create Grid Bot"
        subtitle="Configure a spot grid strategy. Dry-run bots simulate fills locally; LIVE bots require explicit enablement."
      />

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Basics" subtitle="Identity, mode and market" />
            <div className="p-6 space-y-5">
              <div>
                <label htmlFor="bot-name" className="label">Bot name</label>
                <input
                  id="bot-name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="input"
                  placeholder="BTCUSDT conservative grid"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bot-mode" className="label">Trading mode</label>
                  <select
                    id="bot-mode"
                    value={form.mode}
                    onChange={(e) => set('mode', e.target.value as 'DRY_RUN' | 'LIVE')}
                    className="select"
                  >
                    <option value="DRY_RUN">DRY RUN (paper trading)</option>
                    <option value="LIVE">LIVE (real orders)</option>
                  </select>
                  {form.mode === 'LIVE' && (
                    <p className="field-error">
                      Live trading is blocked unless the environment flag, global risk setting, and
                      account live flag are all enabled.
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="bot-account" className="label">
                    Exchange account {form.mode === 'LIVE' ? '(required)' : '(optional)'}
                  </label>
                  <select
                    id="bot-account"
                    value={form.exchangeAccountId}
                    onChange={(e) => set('exchangeAccountId', e.target.value)}
                    className="select"
                  >
                    <option value="">— none —</option>
                    {(accounts || []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.apiKeyMasked}){a.isLiveEnabled ? ' · LIVE' : ''}
                      </option>
                    ))}
                  </select>
                  {(accounts || []).length === 0 && (
                    <p className="field-hint">
                      No accounts yet.{' '}
                      <Link href="/dashboard/exchange" className="link">
                        Add one
                      </Link>{' '}
                      to track balances or trade live.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="market-filter" className="label">Market</label>
                <input
                  id="market-filter"
                  value={symbolQuery}
                  onChange={(e) => setSymbolQuery(e.target.value)}
                  className="input"
                  placeholder="Filter markets, e.g. BTC or USDT…"
                />
                <select
                  value={form.symbol}
                  onChange={(e) => set('symbol', e.target.value)}
                  className="input mt-2 font-mono text-xs"
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
                  <p className="field-hint">
                    price precision {selectedMarket.pricePrecision} · amount precision{' '}
                    {selectedMarket.amountPrecision}
                    {selectedMarket.minNotional ? ` · min notional ${fmtNum(selectedMarket.minNotional)}` : ''}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Grid parameters" subtitle="Range, spacing and risk controls" />
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="grid-type" className="label">Grid type</label>
                  <select
                    id="grid-type"
                    value={form.gridType}
                    onChange={(e) => set('gridType', e.target.value as 'ARITHMETIC' | 'GEOMETRIC')}
                    className="select"
                  >
                    <option value="ARITHMETIC">Arithmetic (equal spacing)</option>
                    <option value="GEOMETRIC">Geometric (equal %)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="grid-count" className="label">Grid count</label>
                  <input
                    id="grid-count"
                    type="number"
                    min={2}
                    max={100}
                    value={form.gridCount}
                    onChange={(e) => set('gridCount', e.target.value)}
                    className="input num"
                  />
                </div>
                <div>
                  <label htmlFor="grid-investment" className="label">
                    Investment ({selectedMarket?.quoteAsset || 'quote'})
                  </label>
                  <input
                    id="grid-investment"
                    value={form.totalInvestmentQuote}
                    onChange={(e) => set('totalInvestmentQuote', e.target.value)}
                    className="input num"
                    placeholder="Total quote amount"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lower-price" className="label">Lower price</label>
                  <input
                    id="lower-price"
                    value={form.lowerPrice}
                    onChange={(e) => set('lowerPrice', e.target.value)}
                    className="input num"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label htmlFor="upper-price" className="label">Upper price</label>
                  <input
                    id="upper-price"
                    value={form.upperPrice}
                    onChange={(e) => set('upperPrice', e.target.value)}
                    className="input num"
                    placeholder="0"
                  />
                </div>
              </div>

              {currentPrice && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-edge bg-deep/50 px-4 py-3 text-sm text-ink-dim">
                  Current price: <strong className="text-ink num">{fmtNum(currentPrice, 6)}</strong>
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
                    Use ±5% around price
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="inventory-mode" className="label">Inventory mode</label>
                  <select
                    id="inventory-mode"
                    value={form.inventoryMode}
                    onChange={(e) =>
                      set('inventoryMode', e.target.value as 'EXISTING_ONLY' | 'AUTO_REBALANCE' | 'MANUAL')
                    }
                    className="select"
                  >
                    <option value="AUTO_REBALANCE">Auto rebalance</option>
                    <option value="EXISTING_ONLY">Existing balance only</option>
                    <option value="MANUAL">Manual amounts</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="min-profit" className="label">Min profit/grid (bps)</label>
                  <input
                    id="min-profit"
                    type="number"
                    min={0}
                    value={form.minProfitAfterFeesBps}
                    onChange={(e) => set('minProfitAfterFeesBps', e.target.value)}
                    className="input num"
                  />
                </div>
                <div>
                  <label htmlFor="range-exit" className="label">On range exit</label>
                  <select
                    id="range-exit"
                    value={form.onRangeExit}
                    onChange={(e) => set('onRangeExit', e.target.value)}
                    className="select"
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
                  <label htmlFor="stop-loss" className="label">
                    Stop-loss price <span className="normal-case text-ink-faint">(optional)</span>
                  </label>
                  <input
                    id="stop-loss"
                    value={form.stopLossPrice}
                    onChange={(e) => set('stopLossPrice', e.target.value)}
                    className="input num"
                  />
                </div>
                <div>
                  <label htmlFor="take-profit" className="label">
                    Take-profit price <span className="normal-case text-ink-faint">(optional)</span>
                  </label>
                  <input
                    id="take-profit"
                    value={form.takeProfitPrice}
                    onChange={(e) => set('takeProfitPrice', e.target.value)}
                    className="input num"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2.5 text-sm text-ink-dim cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.makerOnly}
                      onChange={(e) => set('makerOnly', e.target.checked)}
                      className="h-4 w-4 rounded border-edge-strong bg-deep accent-accent focus:ring-accent/40"
                    />
                    Maker-only orders
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="xl:sticky xl:top-24">
            <CardHeader title="Grid preview" subtitle="Live validation as you type" />
            <div className="p-5 space-y-4 text-sm">
              {!preview ? (
                <p className="text-ink-faint leading-relaxed">
                  Enter a valid lower price, upper price, and grid count to preview the levels.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-deep/60 border border-edge px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-wider text-ink-faint">Levels</p>
                      <p className="mt-0.5 font-semibold text-ink num">{preview.levels.length}</p>
                    </div>
                    <div className="rounded-lg bg-deep/60 border border-edge px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-wider text-ink-faint">Per-grid quote</p>
                      <p className="mt-0.5 font-semibold text-ink num">{fmtNum(preview.perGrid, 4)}</p>
                    </div>
                    <div className="rounded-lg bg-deep/60 border border-edge px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-wider text-ink-faint">Avg spacing</p>
                      <p className="mt-0.5 font-semibold text-ink num">{preview.spacing.avgSpacingPct}%</p>
                    </div>
                    <div className="rounded-lg bg-deep/60 border border-edge px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-wider text-ink-faint">Net profit/grid</p>
                      <p
                        className={`mt-0.5 font-semibold num ${
                          preview.profit?.isProfitable ? 'text-up' : 'text-down'
                        }`}
                      >
                        {preview.profit?.netPct}%
                      </p>
                    </div>
                  </div>

                  {preview.profit && !preview.profit.isProfitable && (
                    <ErrorBanner message="Grid spacing is smaller than round-trip fees (assumed 0.4%). This grid will lose money per cycle." />
                  )}
                  {profitTooLow && preview.profit?.isProfitable && (
                    <Notice tone="warn" message={`Net profit/grid is below your configured minimum of ${minProfitBps} bps.`} />
                  )}
                  {currentPrice &&
                    (Number(currentPrice) < Number(form.lowerPrice) ||
                      Number(currentPrice) > Number(form.upperPrice)) && (
                      <Notice
                        tone="info"
                        message="Current price is outside the grid range; orders will only be placed once the price enters the range."
                      />
                    )}

                  <div className="max-h-72 overflow-y-auto rounded-lg border border-edge">
                    <table className="table !text-xs">
                      <thead className="sticky top-0 bg-panel">
                        <tr>
                          <th>#</th>
                          <th className="text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...preview.levels].reverse().map((lvl) => (
                          <tr
                            key={lvl.levelIndex}
                            className={
                              currentPrice &&
                              Number(lvl.price) <= Number(currentPrice) &&
                              lvl.levelIndex === nearestLevelIndex
                                ? 'bg-accent/[0.08]'
                                : ''
                            }
                          >
                            <td className="text-ink-faint">{lvl.levelIndex}</td>
                            <td className="text-right font-mono num">
                              {lvl.price}
                              {currentPrice &&
                                Number(lvl.price) <= Number(currentPrice) &&
                                lvl.levelIndex === nearestLevelIndex && (
                                  <span className="ml-2 text-[10px] font-semibold uppercase text-accent">nearest</span>
                                )}
                            </td>
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
            <Link href="/dashboard/bots" className="btn-secondary btn-md">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
