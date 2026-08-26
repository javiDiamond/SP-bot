'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { fmtDate, fmtNum } from '@/lib/format';
import { Card, CardHeader, EmptyState, Notice, PageHeader, Spinner } from '@/components/ui';
import type { BalanceSnapshotRow } from '@/lib/types';

export default function BalancesPage() {
  const t = useTranslations('balances');
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
            <th>{t('thAsset')}</th>
            <th className="text-end">{t('thTotal')}</th>
            <th className="text-end">{t('thAvailable')}</th>
            <th className="text-end">{t('thLocked')}</th>
            <th>{t('thAsOf')}</th>
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
              <td className="text-end font-mono num">{fmtNum(b.total, 8)}</td>
              <td className="text-end num">{fmtNum(b.available, 8)}</td>
              <td className="text-end num text-ink-dim">{fmtNum(b.locked, 8)}</td>
              <td className="text-ink-dim">{fmtDate(b.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <Notice
        tone="warn"
        message={
          <>
            <strong>{t('paperNoticeTitle')}</strong>
            {t('paperNoticeBody')}
          </>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <Card>
            <CardHeader title={t('paperCard')} />
            {dryRun.length === 0 ? <EmptyState message={t('emptyPaper')} /> : <Table rows={dryRun} />}
          </Card>

          <Card>
            <CardHeader title={t('liveCard')} />
            {live.length === 0 ? <EmptyState message={t('emptyLive')} /> : <Table rows={live} />}
          </Card>
        </>
      )}
    </div>
  );
}
