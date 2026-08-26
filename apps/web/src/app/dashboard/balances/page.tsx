'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { fmtDate, fmtNum } from '../../../lib/format';
import { Card, CardHeader, EmptyState, Notice, PageHeader, Spinner } from '../../../components/ui';
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
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Asset</th>
            <th className="text-right">Total</th>
            <th className="text-right">Available</th>
            <th className="text-right">Locked</th>
            <th>As of</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id}>
              <td>
                <span className="inline-flex items-center gap-2 font-semibold text-ink">
                  <span className="w-6 h-6 rounded-full bg-accent/12 ring-1 ring-accent/25 text-accent text-[10px] font-bold flex items-center justify-center uppercase">
                    {b.asset.slice(0, 2)}
                  </span>
                  {b.asset}
                </span>
              </td>
              <td className="text-right font-mono num">{fmtNum(b.total, 8)}</td>
              <td className="text-right num">{fmtNum(b.available, 8)}</td>
              <td className="text-right num text-ink-dim">{fmtNum(b.locked, 8)}</td>
              <td className="text-ink-dim">{fmtDate(b.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Balances"
        subtitle="Latest recorded balance per asset. Dry-run balances come from the paper trading engine."
      />

      <Notice
        tone="warn"
        message={
          <>
            <strong>Paper Balances: </strong>
            dry-run balances are simulated; they update when bot fills occur and on periodic
            snapshots — not real-time exchange positions.
          </>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <Card>
            <CardHeader title="Paper (dry-run) balances" />
            {dryRun.length === 0 ? (
              <EmptyState message="No dry-run balances recorded yet. Start a dry-run bot to generate them." />
            ) : (
              <Table rows={dryRun} />
            )}
          </Card>

          <Card>
            <CardHeader title="Live account balances" />
            {live.length === 0 ? (
              <EmptyState message="No live balances recorded." />
            ) : (
              <Table rows={live} />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
