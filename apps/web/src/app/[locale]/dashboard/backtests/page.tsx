'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { Button, Card, CardHeader, EmptyState, ErrorBanner, PageHeader, Spinner } from '@/components/ui';
import type { BacktestRow, MarketRow } from '@/lib/types';

const RESOLUTIONS = ['1', '15', '60', '240', '720', '1D'] as const;

const STATUS_CHIP: Record<string, string> = {
  PENDING: 'badge-neutral',
  RUNNING: 'bg-info/10 text-info ring-info/25',
  COMPLETED: 'bg-up/10 text-up ring-up/25',
  FAILED: 'bg-down/10 text-down ring-down/25',
};

function BacktestStatusBadge({ status }: { status: string }) {
  const t = useTranslations('common.backtestStatus');
  return (
    <span className={`badge ${STATUS_CHIP[status] || STATUS_CHIP.PENDING}`}>
      {status === 'RUNNING' && <span className="glow-dot bg-info animate-pulse-dot" />}
      {t(status as 'PENDING')}
    </span>
  );
}

export default function BacktestsPage() {
  const t = useTranslations('backtests.list');
  const tc = useTranslations('common');
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
    if (!form.name.trim()) return setFormError(t('errNameRequired'));
    if (!form.symbol) return setFormError(t('errMarketRequired'));
    if (!form.dateFrom || !form.dateTo) return setFormError(t('errDateRange'));
    const lower = Number(form.lowerPrice);
    const upper = Number(form.upperPrice);
    if (!(lower > 0) || lower >= upper) return setFormError(t('errPriceRange'));

    setBusy(true);
    try {
      const from = new Date(form.dateFrom);
      const to = new Date(form.dateTo);
      if (from >= to) throw new Error(t('errDateOrder'));

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
      setFormError(err?.message || t('errCreateFailed'));
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
      setError(err?.message || t('errCompareFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <>
            {selected.length >= 2 && (
              <Button variant="secondary" onClick={compare}>
                {t('compare', { count: selected.length })}
              </Button>
            )}
            <Button onClick={() => setShowForm((v) => !v)}>
              {showForm ? t('closeForm') : t('newBacktest')}
            </Button>
          </>
        }
      />

      {error && <ErrorBanner message={error} />}

      {showForm && (
        <Card>
          <CardHeader title={t('formTitle')} subtitle={t('formSub')} />
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {formError && <ErrorBanner message={formError} />}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="bt-name" className="label">{t('nameLabel')}</label>
                <input
                  id="bt-name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label htmlFor="bt-symbol" className="label">{t('marketLabel')}</label>
                <select
                  id="bt-symbol"
                  value={form.symbol}
                  onChange={(e) => set('symbol', e.target.value)}
                  className="select"
                >
                  <option value="">{tc('selectOption')}</option>
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
                <label htmlFor="bt-res" className="label">{t('resolutionLabel')}</label>
                <select
                  id="bt-res"
                  value={form.resolution}
                  onChange={(e) => set('resolution', e.target.value)}
                  className="select"
                >
                  {RESOLUTIONS.map((value) => (
                    <option key={value} value={value}>
                      {t(`resolution.${value}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bt-from" className="label">{t('fromLabel')}</label>
                <input
                  id="bt-from"
                  type="datetime-local"
                  value={form.dateFrom}
                  onChange={(e) => set('dateFrom', e.target.value)}
                  className="input"
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <label htmlFor="bt-to" className="label">{t('toLabel')}</label>
                <input
                  id="bt-to"
                  type="datetime-local"
                  value={form.dateTo}
                  onChange={(e) => set('dateTo', e.target.value)}
                  className="input"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <label htmlFor="bt-gridtype" className="label">{t('gridTypeLabel')}</label>
                <select
                  id="bt-gridtype"
                  value={form.gridType}
                  onChange={(e) => set('gridType', e.target.value)}
                  className="select"
                >
                  <option value="ARITHMETIC">{t('gridTypeArithmetic')}</option>
                  <option value="GEOMETRIC">{t('gridTypeGeometric')}</option>
                </select>
              </div>
              <div>
                <label htmlFor="bt-lower" className="label">{t('lowerLabel')}</label>
                <input
                  id="bt-lower"
                  value={form.lowerPrice}
                  onChange={(e) => set('lowerPrice', e.target.value)}
                  className="input num"
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <label htmlFor="bt-upper" className="label">{t('upperLabel')}</label>
                <input
                  id="bt-upper"
                  value={form.upperPrice}
                  onChange={(e) => set('upperPrice', e.target.value)}
                  className="input num"
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <label htmlFor="bt-count" className="label">{t('gridsLabel')}</label>
                <input
                  id="bt-count"
                  type="number"
                  min={2}
                  value={form.gridCount}
                  onChange={(e) => set('gridCount', e.target.value)}
                  className="input num"
                  dir="ltr"
                />
              </div>
              <div>
                <label htmlFor="bt-invest" className="label">{t('investmentLabel')}</label>
                <input
                  id="bt-invest"
                  value={form.totalInvestmentQuote}
                  onChange={(e) => set('totalInvestmentQuote', e.target.value)}
                  className="input num"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label htmlFor="bt-makerfee" className="label">{t('makerFeeLabel')}</label>
                <input
                  id="bt-makerfee"
                  value={form.makerFee}
                  onChange={(e) => set('makerFee', e.target.value)}
                  className="input num"
                  dir="ltr"
                  placeholder="0.001"
                />
              </div>
              <div>
                <label htmlFor="bt-takerfee" className="label">{t('takerFeeLabel')}</label>
                <input
                  id="bt-takerfee"
                  value={form.takerFee}
                  onChange={(e) => set('takerFee', e.target.value)}
                  className="input num"
                  dir="ltr"
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
                {t('makerOnly')}
              </label>
              <Button type="submit" disabled={busy}>
                {busy ? t('submitting') : t('run')}
              </Button>
            </div>
            <p className="field-hint leading-relaxed">{t('formHint')}</p>
          </form>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <Spinner />
        ) : (backtests || []).length === 0 ? (
          <EmptyState message={t('empty')} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>{t('thName')}</th>
                  <th>{t('thSymbol')}</th>
                  <th>{t('thRange')}</th>
                  <th>{t('thRes')}</th>
                  <th>{t('thStatus')}</th>
                  <th className="text-end">{t('thTrades')}</th>
                  <th className="text-end">{t('thTotalPnl')}</th>
                  <th className="text-end">{t('thVsBh')}</th>
                  <th>{t('thCreated')}</th>
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
                      <td className="text-xs text-ink-dim num whitespace-nowrap">
                        {fmtDate(bt.dateFrom)} <span className="rtl-flip">→</span> {fmtDate(bt.dateTo)}
                      </td>
                      <td className="num">{bt.resolution}</td>
                      <td><BacktestStatusBadge status={bt.status} /></td>
                      <td className="text-end num">{bt.tradeCount ?? tc('dash')}</td>
                      <td
                        className={`text-end font-medium num ${
                          m && Number(m.totalPnL) > 0
                            ? 'text-up'
                            : m && Number(m.totalPnL) < 0
                              ? 'text-down'
                              : ''
                        }`}
                      >
                        {m ? Number(m.totalPnL).toFixed(4) : tc('dash')}
                      </td>
                      <td
                        className={`text-end num ${
                          diff !== null ? (diff >= 0 ? 'text-up' : 'text-down') : ''
                        }`}
                      >
                        {diff !== null ? `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%` : tc('dash')}
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
