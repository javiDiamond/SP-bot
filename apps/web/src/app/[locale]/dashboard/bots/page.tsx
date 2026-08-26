'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { fmtDate, fmtNum, fmtPnl, pnlClass } from '@/lib/format';
import { useBotCommand, allowedCommands, type BotCommand } from '@/lib/useBotCommand';
import {
  Button,
  Card,
  CardHeader,
  ConfirmModal,
  EmptyState,
  ErrorBanner,
  ModeBadge,
  PageHeader,
  Spinner,
  StatusBadge,
} from '@/components/ui';
import type { BotRow } from '@/lib/types';

const COMMAND_KEYS: Record<BotCommand, string> = {
  start: 'start',
  pause: 'pause',
  resume: 'resume',
  stop: 'stop',
  'cancel-all': 'cancelAll',
};

export default function BotsPage() {
  const t = useTranslations('bots');
  const tl = useTranslations('bots.list');
  const tc = useTranslations('common');
  const { data: bots, isLoading } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => (await api.bots()).data as BotRow[],
  });
  const { run, busy, error } = useBotCommand();
  const [confirm, setConfirm] = useState<{ bot: BotRow; command: BotCommand } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const commandLabel = (cmd: BotCommand) => t(`commands.${COMMAND_KEYS[cmd]}`);

  const filtered = (bots || []).filter((b) => statusFilter === 'all' || b.status === statusFilter);

  const statuses = ['all', 'DRAFT', 'RUNNING', 'PAUSED', 'STOPPED', 'ERROR', 'KILLED', 'RANGE_EXITED'];

  return (
    <div className="space-y-6">
      <PageHeader
        title={tl('title')}
        subtitle={tl('subtitle')}
        actions={
          <Link href="/dashboard/bots/new" className="btn-primary btn-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {tl('createNew')}
          </Link>
        }
      />

      {error && <ErrorBanner message={error} />}

      {busy && (
        <div className="flex items-center gap-2.5 rounded-lg border border-info/25 bg-info/[0.06] px-4 py-3 text-sm text-info">
          <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-info/30 border-t-info animate-spin" />
          <span className="leading-relaxed">
            {tc('busyBanner', { command: commandLabel(busy) })}
          </span>
        </div>
      )}

      <Card>
        <CardHeader
          title={tl('allBots')}
          actions={
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select !w-auto !py-1.5 !text-sm"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? tc('allStatuses') : tc(`botStatus.${s}` as 'RUNNING')}
                </option>
              ))}
            </select>
          }
        />

        {isLoading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            message={tl('noBots')}
            action={
              <Link href="/dashboard/bots/new" className="btn-primary btn-sm">
                {tl('createBotSmall')}
              </Link>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{tl('thName')}</th>
                  <th>{tl('thSymbol')}</th>
                  <th>{tl('thMode')}</th>
                  <th>{tl('thStatus')}</th>
                  <th className="text-end">{tl('thGridCycles')}</th>
                  <th className="text-end">{tl('thRealizedPnl')}</th>
                  <th className="text-end">{tl('thUnrealized')}</th>
                  <th>{tl('thCreated')}</th>
                  <th className="text-end">{tl('thActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bot) => (
                  <tr key={bot.id}>
                    <td>
                      <Link href={`/dashboard/bots/${bot.id}`} className="link font-medium">
                        {bot.name}
                      </Link>
                    </td>
                    <td className="font-medium text-ink">{bot.symbol}</td>
                    <td><ModeBadge mode={bot.mode} /></td>
                    <td><StatusBadge status={bot.status} /></td>
                    <td className="text-end num">{fmtNum(bot.totalGridCycles)}</td>
                    <td className={`text-end font-medium num ${pnlClass(bot.realizedPnL)}`}>
                      {fmtPnl(bot.realizedPnL)}
                    </td>
                    <td className={`text-end num ${pnlClass(bot.unrealizedPnL)}`}>
                      {fmtPnl(bot.unrealizedPnL)}
                    </td>
                    <td className="text-ink-dim">{fmtDate(bot.createdAt)}</td>
                    <td>
                      <div className="flex justify-end gap-1.5 flex-wrap">
                        {allowedCommands(bot.status).map((cmd) => (
                          <Button
                            key={cmd}
                            size="sm"
                            variant={cmd === 'stop' || cmd === 'cancel-all' ? 'danger' : cmd === 'pause' ? 'secondary' : 'success'}
                            onClick={() =>
                              cmd === 'stop' || cmd === 'cancel-all'
                                ? setConfirm({ bot, command: cmd })
                                : void run(bot.id, cmd)
                            }
                          >
                            {commandLabel(cmd)}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmModal
        open={confirm !== null}
        title={t('commands.confirmTitle', { command: commandLabel(confirm?.command || 'stop') })}
        message={
          confirm?.command === 'stop'
            ? tl('confirmStopMessage', { name: confirm?.bot.name || '' })
            : tl('confirmCancelAllMessage', { name: confirm?.bot.name || '' })
        }
        danger
        confirmLabel={commandLabel(confirm?.command || 'stop')}
        busy={busy !== null}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) void run(confirm.bot.id, confirm.command);
          setConfirm(null);
        }}
      />
    </div>
  );
}
