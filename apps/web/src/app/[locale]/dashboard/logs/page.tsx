'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { fmtDate } from '@/lib/format';
import { Card, EmptyState, LevelBadge, PageHeader, Spinner } from '@/components/ui';
import type { AuditLogRow, EventLogRow } from '@/lib/types';

type Tab = 'events' | 'audit';

const LEVELS = ['INFO', 'WARN', 'ERROR', 'DEBUG'] as const;

export default function LogsPage() {
  const t = useTranslations('logs');
  const tc = useTranslations('common');
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const [tab, setTab] = useState<Tab>('events');
  const [level, setLevel] = useState('');
  const [action, setAction] = useState('');

  const eventsQuery = useQuery({
    queryKey: ['events', level],
    queryFn: async () =>
      (await api.events({ level: level || undefined, limit: 200 })).data as EventLogRow[],
    enabled: tab === 'events',
    refetchInterval: 15_000,
  });

  const auditQuery = useQuery({
    queryKey: ['audit-logs', action],
    queryFn: async () =>
      (await api.auditLogs({ action: action || undefined, limit: 200 })).data as AuditLogRow[],
    enabled: tab === 'audit' && isAdmin,
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <Card>
        <div className="border-b border-edge px-4 sm:px-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex gap-1">
            {(
              [
                ['events', t('tabEvents')],
                ['audit', t('tabAudit')],
              ] as Array<[Tab, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
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
          <div className="ms-auto py-2">
            {tab === 'events' ? (
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="select !w-auto !py-1.5 !text-sm"
              >
                <option value="">{tc('allLevels')}</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {tc(`level.${l}`)}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder={t('actionFilterPlaceholder')}
                className="input !w-64 !py-1.5 !text-sm"
                dir="ltr"
              />
            )}
          </div>
        </div>

        {tab === 'events' &&
          (eventsQuery.isLoading ? (
            <Spinner />
          ) : (eventsQuery.data || []).length === 0 ? (
            <EmptyState message={t('emptyEvents')} />
          ) : (
            <ul className="divide-y divide-edge text-sm">
              {(eventsQuery.data || []).map((e) => (
                <li key={e.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <LevelBadge level={e.level} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-ink">{e.message}</p>
                    <p className="text-xs text-ink-faint mt-0.5">
                      {e.event}
                      {e.botId && (
                        <>
                          {' · '}
                          {t('eventBotPrefix')}{' '}
                          <Link href={`/dashboard/bots/${e.botId}`} className="link" dir="ltr">
                            {e.botId.slice(0, 8)}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-ink-faint shrink-0">{fmtDate(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          ))}

        {tab === 'audit' &&
          (!isAdmin ? (
            <EmptyState message={t('auditNeedsAdmin')} />
          ) : auditQuery.isLoading ? (
            <Spinner />
          ) : (auditQuery.data || []).length === 0 ? (
            <EmptyState message={t('emptyAudit')} />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('thTime')}</th>
                    <th>{t('thUser')}</th>
                    <th>{t('thAction')}</th>
                    <th>{t('thResource')}</th>
                    <th>{t('thDetails')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(auditQuery.data || []).map((a) => (
                    <tr key={a.id}>
                      <td className="text-ink-dim">{fmtDate(a.createdAt)}</td>
                      <td dir="ltr">{a.user?.email || a.userId.slice(0, 8)}</td>
                      {/* Audit actions are operational identifiers: kept LTR, untranslated. */}
                      <td className="font-medium text-ink" dir="ltr">{a.action}</td>
                      <td dir="ltr">{a.resource ? `${a.resource} (${(a.resourceId || '').slice(0, 8)})` : tc('dash')}</td>
                      <td className="!whitespace-normal text-xs text-ink-faint max-w-xs truncate" dir="ltr">
                        {a.data ? JSON.stringify(a.data) : tc('dash')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </Card>
    </div>
  );
}
