'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, downloadWithAuth } from '../../../lib/api';
import { fmtDate, fmtNum } from '../../../lib/format';
import { Button, Card, EmptyState, PageHeader, SideBadge, Spinner } from '../../../components/ui';
import type { FillRow, OrderRow } from '../../../lib/types';

type Tab = 'orders' | 'fills';

export default function OrdersPage() {
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
        title="Orders & Fills"
        subtitle="Order history across all of your bots"
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              void downloadWithAuth('/api/orders/fills/export.csv', 'fills.csv', {
                symbol: symbol || undefined,
              })
            }
          >
            Export fills CSV
          </Button>
        }
      />

      <Card>
        <div className="border-b border-edge px-4 sm:px-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex gap-1">
            {(
              [
                ['orders', 'Orders'],
                ['fills', 'Fills'],
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
          <div className="ml-auto flex flex-wrap items-center gap-2 py-2">
            <input
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value.toUpperCase());
                setPage(1);
              }}
              placeholder="Symbol, e.g. BTCUSDT"
              className="input !w-44 !py-1.5 !text-sm"
            />
            <select
              value={side}
              onChange={(e) => {
                setSide(e.target.value);
                setPage(1);
              }}
              className="select !w-auto !py-1.5 !text-sm"
            >
              <option value="">Any side</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
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
                <option value="">Any status</option>
                {['NEW', 'PARTIALLY_FILLED', 'FILLED', 'CANCELED', 'REJECTED'].map((s) => (
                  <option key={s} value={s}>
                    {s}
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
            <EmptyState message="No orders match the filters." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Created</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Executed</th>
                    <th className="text-right">Fee</th>
                    <th>Dry</th>
                  </tr>
                </thead>
                <tbody>
                  {(ordersQuery.data?.data || []).map((o) => (
                    <tr key={o.id}>
                      <td className="text-ink-dim">{fmtDate(o.createdAt)}</td>
                      <td className="font-medium text-ink">{o.symbol}</td>
                      <td><SideBadge side={o.side} /></td>
                      <td>{o.type}</td>
                      <td className="text-ink-dim">{o.status}</td>
                      <td className="text-right font-mono num">{fmtNum(o.price, 8)}</td>
                      <td className="text-right num">{fmtNum(o.quantity, 8)}</td>
                      <td className="text-right num">{fmtNum(o.executedQty, 8)}</td>
                      <td className="text-right num">{fmtNum(o.fee, 8)}</td>
                      <td className="text-ink-dim">{o.isDryRun ? 'yes' : 'no'}</td>
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
            <EmptyState message="No fills match the filters." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Sum</th>
                    <th className="text-right">Fee</th>
                    <th>Dry</th>
                  </tr>
                </thead>
                <tbody>
                  {(fillsQuery.data?.data || []).map((f) => (
                    <tr key={f.id}>
                      <td className="text-ink-dim">{fmtDate(f.timestamp)}</td>
                      <td className="font-medium text-ink">{f.symbol || f.order?.symbol || '—'}</td>
                      <td><SideBadge side={f.isBuyer ? 'BUY' : 'SELL'} /></td>
                      <td className="text-right font-mono num">{fmtNum(f.price, 8)}</td>
                      <td className="text-right num">{fmtNum(f.quantity, 8)}</td>
                      <td className="text-right num">{fmtNum(f.sum, 4)}</td>
                      <td className="text-right num">{fmtNum(f.fee, 8)}</td>
                      <td className="text-ink-dim">{f.isDryRun ? 'yes' : 'no'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        <div className="px-5 py-3 border-t border-edge flex items-center justify-between text-sm text-ink-dim">
          <span className="num">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
