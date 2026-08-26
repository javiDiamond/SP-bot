'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';
import { fmtDate } from '../../../lib/format';
import { EmptyState, Spinner } from '../../../components/ui';
import type { AuditLogRow, EventLogRow } from '../../../lib/types';

type Tab = 'events' | 'audit';

function levelChip(level: string) {
  const map: Record<string, string> = {
    ERROR: 'bg-red-100 text-red-700',
    WARN: 'bg-yellow-100 text-yellow-700',
    INFO: 'bg-blue-100 text-blue-700',
    DEBUG: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${map[level] || map.INFO}`}>
      {level}
    </span>
  );
}

export default function LogsPage() {
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Logs</h2>
        <p className="mt-1 text-sm text-gray-500">Engine event logs and user action audit trail</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200 px-6 flex items-center gap-4">
          <div className="flex gap-6">
            {(
              [
                ['events', 'Events'],
                ['audit', 'Audit Log'],
              ] as Array<[Tab, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
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
          <div className="ml-auto py-2">
            {tab === 'events' ? (
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">All levels</option>
                {['INFO', 'WARN', 'ERROR', 'DEBUG'].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Filter by action, e.g. bot.start"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm w-64"
              />
            )}
          </div>
        </div>

        {tab === 'events' &&
          (eventsQuery.isLoading ? (
            <Spinner />
          ) : (eventsQuery.data || []).length === 0 ? (
            <EmptyState message="No events recorded yet." />
          ) : (
            <ul className="divide-y divide-gray-200 text-sm">
              {(eventsQuery.data || []).map((e) => (
                <li key={e.id} className="px-6 py-3 flex items-start gap-3">
                  {levelChip(e.level)}
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-800">{e.message}</p>
                    <p className="text-xs text-gray-400">
                      {e.event}
                      {e.botId && (
                        <>
                          {' · bot '}
                          <Link
                            href={`/dashboard/bots/${e.botId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {e.botId.slice(0, 8)}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{fmtDate(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          ))}

        {tab === 'audit' &&
          (!isAdmin ? (
            <EmptyState message="Audit logs require the ADMIN role." />
          ) : auditQuery.isLoading ? (
            <Spinner />
          ) : (auditQuery.data || []).length === 0 ? (
            <EmptyState message="No audit log entries." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Resource</th>
                    <th className="px-6 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(auditQuery.data || []).map((a) => (
                    <tr key={a.id}>
                      <td className="px-6 py-2 text-gray-500">{fmtDate(a.createdAt)}</td>
                      <td className="px-6 py-2">{a.user?.email || a.userId.slice(0, 8)}</td>
                      <td className="px-6 py-2 font-medium">{a.action}</td>
                      <td className="px-6 py-2">
                        {a.resource ? `${a.resource} (${(a.resourceId || '').slice(0, 8)})` : '—'}
                      </td>
                      <td className="px-6 py-2 text-xs text-gray-400 max-w-xs truncate">
                        {a.data ? JSON.stringify(a.data) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>
    </div>
  );
}
