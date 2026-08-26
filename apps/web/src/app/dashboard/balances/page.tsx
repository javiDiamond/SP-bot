'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { fmtDate, fmtNum } from '../../../lib/format';
import { EmptyState, Spinner } from '../../../components/ui';
import type { BalanceSnapshotRow } from '../../../lib/types';

export default function BalancesPage() {
  const { data: balances, isLoading } = useQuery({
    queryKey: ['balances'],
    queryFn: async () => (await api.balances()).data as BalanceSnapshotRow[],
    refetchInterval: 30_000,
  });

  const dryRun = (balances || []).filter((b) => b.isDryRun);
  const live = (balances || []).filter((b) => !b.isDryRun);

  const Table = ({ rows }: { rows: BalanceSnapshotRow[] }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
          <tr>
            <th className="px-6 py-3">Asset</th>
            <th className="px-6 py-3 text-right">Total</th>
            <th className="px-6 py-3 text-right">Available</th>
            <th className="px-6 py-3 text-right">Locked</th>
            <th className="px-6 py-3">As of</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {rows.map((b) => (
            <tr key={b.id}>
              <td className="px-6 py-3 font-medium text-gray-900">{b.asset}</td>
              <td className="px-6 py-3 text-right font-mono">{fmtNum(b.total, 8)}</td>
              <td className="px-6 py-3 text-right">{fmtNum(b.available, 8)}</td>
              <td className="px-6 py-3 text-right">{fmtNum(b.locked, 8)}</td>
              <td className="px-6 py-3 text-gray-500">{fmtDate(b.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Balances</h2>
        <p className="mt-1 text-sm text-gray-500">
          Latest recorded balance per asset. Dry-run balances come from the paper trading engine.
        </p>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
        <p className="text-sm text-yellow-700">
          <strong className="font-medium">Paper Balances: </strong>
          dry-run balances are simulated; they update when bot fills occur and on periodic
          snapshots — not real-time exchange positions.
        </p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Paper (dry-run) balances</h3>
            </div>
            {dryRun.length === 0 ? (
              <EmptyState message="No dry-run balances recorded yet. Start a dry-run bot to generate them." />
            ) : (
              <Table rows={dryRun} />
            )}
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Live account balances</h3>
            </div>
            {live.length === 0 ? (
              <EmptyState message="No live balances recorded." />
            ) : (
              <Table rows={live} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
