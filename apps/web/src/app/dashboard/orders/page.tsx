'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, downloadWithAuth } from '../../../lib/api';
import { fmtDate, fmtNum } from '../../../lib/format';
import { Button, EmptyState, SideBadge, Spinner } from '../../../components/ui';
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders & Fills</h2>
          <p className="mt-1 text-sm text-gray-500">Order history across all of your bots</p>
        </div>
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
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200 px-6 flex flex-wrap items-center gap-4">
          <div className="flex gap-6">
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
                className={`py-3 text-sm font-medium border-b-2 -mb-px ${
                  tab === key
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 py-2">
            <input
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value.toUpperCase());
                setPage(1);
              }}
              placeholder="Symbol, e.g. BTCUSDT"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm w-44"
            />
            <select
              value={side}
              onChange={(e) => {
                setSide(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
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
                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Symbol</th>
                    <th className="px-4 py-3">Side</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Executed</th>
                    <th className="px-4 py-3 text-right">Fee</th>
                    <th className="px-4 py-3">Dry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(ordersQuery.data?.data || []).map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-500">{fmtDate(o.createdAt)}</td>
                      <td className="px-4 py-2 font-medium">{o.symbol}</td>
                      <td className="px-4 py-2"><SideBadge side={o.side} /></td>
                      <td className="px-4 py-2">{o.type}</td>
                      <td className="px-4 py-2">{o.status}</td>
                      <td className="px-4 py-2 text-right font-mono">{fmtNum(o.price, 8)}</td>
                      <td className="px-4 py-2 text-right">{fmtNum(o.quantity, 8)}</td>
                      <td className="px-4 py-2 text-right">{fmtNum(o.executedQty, 8)}</td>
                      <td className="px-4 py-2 text-right">{fmtNum(o.fee, 8)}</td>
                      <td className="px-4 py-2">{o.isDryRun ? 'yes' : 'no'}</td>
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Symbol</th>
                    <th className="px-4 py-3">Side</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Sum</th>
                    <th className="px-4 py-3 text-right">Fee</th>
                    <th className="px-4 py-3">Dry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(fillsQuery.data?.data || []).map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-500">{fmtDate(f.timestamp)}</td>
                      <td className="px-4 py-2 font-medium">{f.symbol || f.order?.symbol || '—'}</td>
                      <td className="px-4 py-2"><SideBadge side={f.isBuyer ? 'BUY' : 'SELL'} /></td>
                      <td className="px-4 py-2 text-right font-mono">{fmtNum(f.price, 8)}</td>
                      <td className="px-4 py-2 text-right">{fmtNum(f.quantity, 8)}</td>
                      <td className="px-4 py-2 text-right">{fmtNum(f.sum, 4)}</td>
                      <td className="px-4 py-2 text-right">{fmtNum(f.fee, 8)}</td>
                      <td className="px-4 py-2">{f.isDryRun ? 'yes' : 'no'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>
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
      </div>
    </div>
  );
}
