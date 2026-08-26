'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { api, downloadWithAuth } from '@/lib/api';
import { fmtCount, fmtDate, fmtNum } from '@/lib/format';
import { Button, Card, EmptyState, PageHeader, SideBadge, Spinner } from '@/components/ui';
import type { FillRow, OrderRow } from '@/lib/types';

type Tab = 'orders' | 'fills';

const ORDER_STATUSES = ['NEW', 'PARTIALLY_FILLED', 'FILLED', 'CANCELED', 'REJECTED'] as const;

export default function OrdersPage() {
  const t = useTranslations('orders');
  const tc = useTranslations('common');
  const tca = useTranslations('common.actions');
  const [tab, setTab] = useState<Tab>('orders');
  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 50;

  const ordersQuery = useQuery({
    queryKey: ['orders', symbol, side, status, page],
    queryFn: async () => {
      const res = await api.orders({
        symbol: symbol || undefined,
        side: side || undefined,
        status: status || undefined,
        page,
        perPage,
      });
      return { data: res.data as OrderRow[], pagination: res.pagination };
    },
    enabled: tab === 'orders',
    placeholderData: (prev) => prev,
  });

  const fillsQuery = useQuery({
    queryKey: ['fills', symbol, side, page],
    queryFn: async () => {
      const res = await api.fills({
        symbol: symbol || undefined,
        side: (side as 'BUY' | 'SELL') || undefined,
        page,
        perPage,
      });
      return { data: res.data as FillRow[], pagination: res.pagination };
    },
    enabled: tab === 'fills',
    placeholderData: (prev) => prev,
  });

  const totalPages = Math.max(
    1,
    Math.ceil(((tab === 'orders' ? ordersQuery.data?.pagination : fillsQuery.data?.pagination)?.total || 0) / perPage),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              void downloadWithAuth('/api/orders/fills/export.csv', 'fills.csv', {
                symbol: symbol || undefined,
              })
            }
          >
            {t('exportCsv')}
          </Button>
        }
      />

      <Card>
        <div className="border-b border-edge px-4 sm:px-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex gap-1">
            {(
              [
                ['orders', t('tabOrders')],
                ['fills', t('tabFills')],
              ] as Array<[Tab, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setTab(key);
                  setPage(1);
                }}
                className={`px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === key
                    ? 'border-accent text-accent'
                    : 'border-transparent text-ink-dim hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ms-auto flex flex-wrap items-center gap-2 py-2">
            <input
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value.toUpperCase());
                setPage(1);
              }}
              placeholder={t('symbolPlaceholder')}
              className="input !w-44 !py-1.5 !text-sm"
              dir="ltr"
            />
            <select
              value={side}
              onChange={(e) => {
                setSide(e.target.value);
                setPage(1);
              }}
              className="select !w-auto !py-1.5 !text-sm"
            >
              <option value="">{tc('anySide')}</option>
              <option value="BUY">{tc('side.BUY')}</option>
              <option value="SELL">{tc('side.SELL')}</option>
            </select>
            {tab === 'orders' && (
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="select !w-auto !py-1.5 !text-sm"
              >
                <option value="">{tc('anyStatus')}</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {tc(`orderStatus.${s}` as 'NEW')}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {tab === 'orders' &&
          (ordersQuery.isLoading ? (
            <Spinner />
          ) : (ordersQuery.data?.data || []).length === 0 ? (
            <EmptyState message={t('emptyOrders')} />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('thCreated')}</th>
                    <th>{t('thSymbol')}</th>
                    <th>{t('thSide')}</th>
                    <th>{t('thType')}</th>
                    <th>{t('thStatus')}</th>
                    <th className="text-end">{t('thPrice')}</th>
                    <th className="text-end">{t('thQty')}</th>
                    <th className="text-end">{t('thExecuted')}</th>
                    <th className="text-end">{t('thFee')}</th>
                    <th>{t('thDry')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(ordersQuery.data?.data || []).map((o) => (
                    <tr key={o.id}>
                      <td className="text-ink-dim">{fmtDate(o.createdAt)}</td>
                      <td className="font-medium text-ink">{o.symbol}</td>
                      <td><SideBadge side={o.side} /></td>
                      <td>{o.type}</td>
                      <td className="text-ink-dim">{tc(`orderStatus.${o.status}` as 'NEW')}</td>
                      <td className="text-end font-mono num">{fmtNum(o.price, 8)}</td>
                      <td className="text-end num">{fmtNum(o.quantity, 8)}</td>
                      <td className="text-end num">{fmtNum(o.executedQty, 8)}</td>
                      <td className="text-end num">{fmtNum(o.fee, 8)}</td>
                      <td className="text-ink-dim">{o.isDryRun ? tc('yes') : tc('no')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === 'fills' &&
          (fillsQuery.isLoading ? (
            <Spinner />
          ) : (fillsQuery.data?.data || []).length === 0 ? (
            <EmptyState message={t('emptyFills')} />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('thTime')}</th>
                    <th>{t('thSymbol')}</th>
                    <th>{t('thSide')}</th>
                    <th className="text-end">{t('thPrice')}</th>
                    <th className="text-end">{t('thQty')}</th>
                    <th className="text-end">{t('thSum')}</th>
                    <th className="text-end">{t('thFee')}</th>
                    <th>{t('thDry')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(fillsQuery.data?.data || []).map((f) => (
                    <tr key={f.id}>
                      <td className="text-ink-dim">{fmtDate(f.timestamp)}</td>
                      <td className="font-medium text-ink">{f.symbol || f.order?.symbol || tc('dash')}</td>
                      <td><SideBadge side={f.isBuyer ? 'BUY' : 'SELL'} /></td>
                      <td className="text-end font-mono num">{fmtNum(f.price, 8)}</td>
                      <td className="text-end num">{fmtNum(f.quantity, 8)}</td>
                      <td className="text-end num">{fmtNum(f.sum, 4)}</td>
                      <td className="text-end num">{fmtNum(f.fee, 8)}</td>
                      <td className="text-ink-dim">{f.isDryRun ? tc('yes') : tc('no')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        <div className="px-5 py-3 border-t border-edge flex items-center justify-between gap-3 text-sm text-ink-dim">
          <span className="num">
            {tc('pagination', { page: fmtCount(page), totalPages: fmtCount(totalPages) })}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {tca('previous')}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {tca('next')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
