'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { generateGridLevels, gridProfit, spacingInfo } from '@/lib/grid';
import { fmtNum } from '@/lib/format';
import { Button, Card, CardHeader, ErrorBanner, Notice, PageHeader } from '@/components/ui';
import type { ExchangeAccountRow, MarketRow } from '@/lib/types';

const DEFAULT_FEE = '0.002'; // 0.2% assumed maker/taker for preview

const RANGE_EXIT_OPTIONS = [
  'PAUSE_KEEP_ORDERS',
  'PAUSE_CANCEL_ALL',
  'STOP_CANCEL_ALL',
  'RECENTER',
  'TRAILING',
] as const;

export default function NewBotPage() {
  const t = useTranslations('bots.new');
  const tc = useTranslations('common');
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

    if (!form.name.trim()) return setError(t('errNameRequired'));
    if (!form.symbol) return setError(t('errSymbolRequired'));
    const lower = Number(form.lowerPrice);
    const upper = Number(form.upperPrice);
    if (!(lower > 0) || !(upper > 0) || lower >= upper) return setError(t('errPriceRange'));
    if (Number(form.gridCount) < 2) return setError(t('errGridCount'));
    if (form.mode === 'LIVE' && !form.exchangeAccountId) return setError(t('errLiveAccount'));

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
      setError(err?.message || t('errCreateFailed'));
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
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader title={t('basicsTitle')} subtitle={t('basicsSub')} />
            <div className="p-6 space-y-5">
              <div>
                <label htmlFor="bot-name" className="label">{t('nameLabel')}</label>
                <input
                  id="bot-name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="input"
                  placeholder={t('namePlaceholder')}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bot-mode" className="label">{t('modeLabel')}</label>
                  <select
                    id="bot-mode"
                    value={form.mode}
                    onChange={(e) => set('mode', e.target.value as 'DRY_RUN' | 'LIVE')}
                    className="select"
                  >
                    <option value="DRY_RUN">{t('modeDryRun')}</option>
                    <option value="LIVE">{t('modeLive')}</option>
                  </select>
                  {form.mode === 'LIVE' && <p className="field-error">{t('liveBlockedHint')}</p>}
                </div>
                <div>
                  <label htmlFor="bot-account" className="label">
                    {t('accountLabel')} {form.mode === 'LIVE' ? tc('required') : tc('optional')}
                  </label>
                  <select
                    id="bot-account"
                    value={form.exchangeAccountId}
                    onChange={(e) => set('exchangeAccountId', e.target.value)}
                    className="select"
                  >
                    <option value="">{tc('noneOption')}</option>
                    {(accounts || []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.apiKeyMasked}){a.isLiveEnabled ? ` ${t('accountLiveSuffix')}` : ''}
                      </option>
                    ))}
                  </select>
                  {(accounts || []).length === 0 && (
                    <p className="field-hint">
                      {t('noAccountsHintStart')}{' '}
                      <Link href="/dashboard/exchange" className="link">
                        {t('noAccountsLink')}
                      </Link>{' '}
                      {t('noAccountsHintEnd')}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="market-filter" className="label">{t('marketLabel')}</label>
                <input
                  id="market-filter"
                  value={symbolQuery}
                  onChange={(e) => setSymbolQuery(e.target.value)}
                  className="input"
                  placeholder={t('marketFilterPlaceholder')}
                />
                <select
                  value={form.symbol}
                  onChange={(e) => set('symbol', e.target.value)}
                  className="input mt-2 font-mono text-xs"
                  size={6}
                >
                  <option value="">{t('selectMarket')}</option>
                  {filteredMarkets.map((m) => (
                    <option key={m.symbol} value={m.symbol}>
                      {m.symbol} — {m.baseAsset}/{m.quoteAsset}
                      {m.lastPrice ? ` @ ${fmtNum(m.lastPrice, 6)}` : ''}
                    </option>
                  ))}
                </select>
                {selectedMarket && (
                  <p className="field-hint num">
                    {t('precisionHint', {
                      price: selectedMarket.pricePrecision,
                      amount: selectedMarket.amountPrecision,
                    })}
                    {selectedMarket.minNotional
                      ? ` · ${t('minNotionalHint', { min: fmtNum(selectedMarket.minNotional) })}`
                      : ''}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={t('gridTitle')} subtitle={t('gridSub')} />
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="grid-type" className="label">{t('gridTypeLabel')}</label>
                  <select
                    id="grid-type"
                    value={form.gridType}
                    onChange={(e) => set('gridType', e.target.value as 'ARITHMETIC' | 'GEOMETRIC')}
                    className="select"
                  >
                    <option value="ARITHMETIC">{t('gridTypeArithmetic')}</option>
                    <option value="GEOMETRIC">{t('gridTypeGeometric')}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="grid-count" className="label">{t('gridCountLabel')}</label>
                  <input
                    id="grid-count"
                    type="number"
                    min={2}
                    max={100}
                    value={form.gridCount}
                    onChange={(e) => set('gridCount', e.target.value)}
                    className="input num"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label htmlFor="grid-investment" className="label">
                    {t('investmentLabel', { asset: selectedMarket?.quoteAsset || 'quote' })}
                  </label>
                  <input
                    id="grid-investment"
                    value={form.totalInvestmentQuote}
                    onChange={(e) => set('totalInvestmentQuote', e.target.value)}
                    className="input num"
                    dir="ltr"
                    placeholder={t('investmentPlaceholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lower-price" className="label">{t('lowerLabel')}</label>
                  <input
                    id="lower-price"
                    value={form.lowerPrice}
                    onChange={(e) => set('lowerPrice', e.target.value)}
                    className="input num"
                    dir="ltr"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label htmlFor="upper-price" className="label">{t('upperLabel')}</label>
                  <input
                    id="upper-price"
                    value={form.upperPrice}
                    onChange={(e) => set('upperPrice', e.target.value)}
                    className="input num"
                    dir="ltr"
                    placeholder="0"
                  />
                </div>
              </div>

              {currentPrice && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-edge bg-deep/50 px-4 py-3 text-sm text-ink-dim">
                  {t('currentPrice')} <strong className="text-ink num">{fmtNum(currentPrice, 6)}</strong>
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
                    {t('useRange')}
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="inventory-mode" className="label">{t('inventoryLabel')}</label>
                  <select
                    id="inventory-mode"
                    value={form.inventoryMode}
                    onChange={(e) =>
                      set('inventoryMode', e.target.value as 'EXISTING_ONLY' | 'AUTO_REBALANCE' | 'MANUAL')
                    }
                    className="select"
                  >
                    <option value="AUTO_REBALANCE">{t('inventoryAuto')}</option>
                    <option value="EXISTING_ONLY">{t('inventoryExisting')}</option>
                    <option value="MANUAL">{t('inventoryManual')}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="min-profit" className="label">{t('minProfitLabel')}</label>
                  <input
                    id="min-profit"
                    type="number"
                    min={0}
                    value={form.minProfitAfterFeesBps}
                    onChange={(e) => set('minProfitAfterFeesBps', e.target.value)}
                    className="input num"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label htmlFor="range-exit" className="label">{t('rangeExitLabel')}</label>
                  <select
                    id="range-exit"
                    value={form.onRangeExit}
                    onChange={(e) => set('onRangeExit', e.target.value)}
                    className="select"
                  >
                    {RANGE_EXIT_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {t(`rangeExit.${value}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="stop-loss" className="label">
                    {t('stopLossLabel')} <span className="normal-case text-ink-faint">{tc('optional')}</span>
                  </label>
                  <input
                    id="stop-loss"
                    value={form.stopLossPrice}
                    onChange={(e) => set('stopLossPrice', e.target.value)}
                    className="input num"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label htmlFor="take-profit" className="label">
                    {t('takeProfitLabel')} <span className="normal-case text-ink-faint">{tc('optional')}</span>
                  </label>
                  <input
                    id="take-profit"
                    value={form.takeProfitPrice}
                    onChange={(e) => set('takeProfitPrice', e.target.value)}
                    className="input num"
                    dir="ltr"
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
                    {t('makerOnly')}
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="xl:sticky xl:top-24">
            <CardHeader title={t('previewTitle')} subtitle={t('previewSub')} />
            <div className="p-5 space-y-4 text-sm">
              {!preview ? (
                <p className="text-ink-faint leading-relaxed">{t('previewHint')}</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-deep/60 border border-edge px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-wider text-ink-faint">{t('previewLevels')}</p>
                      <p className="mt-0.5 font-semibold text-ink num">{preview.levels.length}</p>
                    </div>
                    <div className="rounded-lg bg-deep/60 border border-edge px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-wider text-ink-faint">{t('previewPerGrid')}</p>
                      <p className="mt-0.5 font-semibold text-ink num">{fmtNum(preview.perGrid, 4)}</p>
                    </div>
                    <div className="rounded-lg bg-deep/60 border border-edge px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-wider text-ink-faint">{t('previewSpacing')}</p>
                      <p className="mt-0.5 font-semibold text-ink num">{preview.spacing.avgSpacingPct}%</p>
                    </div>
                    <div className="rounded-lg bg-deep/60 border border-edge px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-wider text-ink-faint">{t('previewNetProfit')}</p>
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
                    <ErrorBanner message={t('previewFeeWarn')} />
                  )}
                  {profitTooLow && preview.profit?.isProfitable && (
                    <Notice tone="warn" message={t('previewMinProfitWarn', { bps: minProfitBps })} />
                  )}
                  {currentPrice &&
                    (Number(currentPrice) < Number(form.lowerPrice) ||
                      Number(currentPrice) > Number(form.upperPrice)) && (
                      <Notice tone="info" message={t('previewOutOfRange')} />
                    )}

                  <div className="max-h-72 overflow-y-auto rounded-lg border border-edge">
                    <table className="table !text-xs">
                      <thead className="sticky top-0 bg-panel">
                        <tr>
                          <th>#</th>
                          <th className="text-end">{t('previewThPrice')}</th>
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
                            <td className="text-end font-mono num">
                              {lvl.price}
                              {currentPrice &&
                                Number(lvl.price) <= Number(currentPrice) &&
                                lvl.levelIndex === nearestLevelIndex && (
                                  <span className="ms-2 text-[10px] font-semibold uppercase text-accent">
                                    {t('nearest')}
                                  </span>
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
              {busy ? t('creating') : t('submit')}
            </Button>
            <Link href="/dashboard/bots" className="btn-secondary btn-md">
              {t('cancelLink')}
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
