'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';
import { Button, Card, CardHeader, ConfirmModal, ErrorBanner, Notice, PageHeader, Spinner } from '../../../components/ui';
import type { SystemStatusData } from '../../../lib/types';

function ServicePill({ ok, okLabel, badLabel }: { ok: boolean; okLabel: string; badLabel: string }) {
  return (
    <span className={`badge ${ok ? 'bg-up/10 text-up ring-up/25' : 'bg-down/10 text-down ring-down/25'}`}>
      <span className={`glow-dot ${ok ? 'bg-up' : 'bg-down animate-pulse-dot'}`} />
      {ok ? okLabel : badLabel}
    </span>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const { data: status, isLoading } = useQuery({
    queryKey: ['system-status'],
    queryFn: async () => (await api.systemStatus()).data as SystemStatusData,
    refetchInterval: 15_000,
  });

  const { data: queueDepths } = useQuery({
    queryKey: ['queue-depths'],
    queryFn: async () => (await api.queueDepths()).data,
    refetchInterval: 15_000,
  });

  const [form, setForm] = useState({
    maxBotsGlobal: '10',
    maxBotsPerSymbol: '3',
    maxDailyLossPercent: '5',
    maxQuoteExposureGlobal: '100000',
  });
  const [saving, setSaving] = useState(false);
  const [killBusy, setKillBusy] = useState(false);
  const [error, setError] = useState('');
  const [killConfirm, setKillConfirm] = useState<null | boolean>(null);

  useEffect(() => {
    const rs = status?.riskSettings;
    if (rs) {
      setForm({
        maxBotsGlobal: String(rs.maxBotsGlobal),
        maxBotsPerSymbol: String(rs.maxBotsPerSymbol),
        maxDailyLossPercent: String(rs.maxDailyLossPercent),
        maxQuoteExposureGlobal: String(rs.maxQuoteExposureGlobal),
      });
    }
  }, [status?.riskSettings]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['system-status'] });
  };

  const saveRiskSettings = async () => {
    setError('');
    setSaving(true);
    try {
      await api.updateRiskSettings({
        maxBotsGlobal: Number(form.maxBotsGlobal),
        maxBotsPerSymbol: Number(form.maxBotsPerSymbol),
        maxDailyLossPercent: Number(form.maxDailyLossPercent),
        maxQuoteExposureGlobal: form.maxQuoteExposureGlobal,
      });
      refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to save risk settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleKillSwitch = async (active: boolean) => {
    setKillBusy(true);
    setError('');
    try {
      await api.killSwitch(active);
      refresh();
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    } catch (err: any) {
      setError(err?.message || 'Kill switch toggle failed');
    } finally {
      setKillBusy(false);
      setKillConfirm(null);
    }
  };

  if (isLoading) return <Spinner />;

  const risk = status?.riskSettings;
  const killActive = risk?.killSwitchActive ?? false;
  const liveEnv = status?.liveTradingEnv ?? false;

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Settings" subtitle="Global risk controls and emergency switches" />

      {error && <ErrorBanner message={error} />}

      {!isAdmin && (
        <Notice tone="info" message="Read-only view — risk settings and the kill switch require the ADMIN role." />
      )}

      {/* System status */}
      <Card>
        <CardHeader title="System status" />
        <div className="p-5">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-deep/60 border border-edge px-4 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Database</dt>
              <dd className="mt-1.5">
                <ServicePill ok={Boolean(status?.services?.database)} okLabel="Connected" badLabel="Down" />
              </dd>
            </div>
            <div className="rounded-lg bg-deep/60 border border-edge px-4 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Redis</dt>
              <dd className="mt-1.5">
                <ServicePill ok={Boolean(status?.services?.redis)} okLabel="Connected" badLabel="Down" />
              </dd>
            </div>
            <div className="rounded-lg bg-deep/60 border border-edge px-4 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Live trading (environment)</dt>
              <dd className="mt-1.5">
                <span className={`badge ${liveEnv ? 'bg-down/10 text-down ring-down/25' : 'bg-up/10 text-up ring-up/25'}`}>
                  {liveEnv ? 'ENABLE_LIVE_TRADING=true' : 'ENABLE_LIVE_TRADING=false'}
                </span>
              </dd>
            </div>
            <div className="rounded-lg bg-deep/60 border border-edge px-4 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Allow live trading (DB)</dt>
              <dd className="mt-1.5">
                <ServicePill ok={!risk?.allowLiveTrading} okLabel="Blocked" badLabel="Allowed" />
              </dd>
            </div>
            {queueDepths && (
              <div className="rounded-lg bg-deep/60 border border-edge px-4 py-3 sm:col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Queue depths</dt>
                <dd className="mt-1.5 text-sm text-ink-dim num">
                  {Object.entries(queueDepths)
                    .map(([q, d]) => `${q}: ${d}`)
                    .join(' · ')}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </Card>

      {/* Risk limits */}
      <Card>
        <CardHeader
          title="Global risk limits"
          actions={
            isAdmin && (
              <Button size="sm" onClick={saveRiskSettings} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            )
          }
        />
        <div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="risk-maxbots" className="label">Max bots (global)</label>
            <input
              id="risk-maxbots"
              type="number"
              value={form.maxBotsGlobal}
              disabled={!isAdmin}
              onChange={(e) => setForm((f) => ({ ...f, maxBotsGlobal: e.target.value }))}
              className="input num disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="risk-maxbotsymbol" className="label">Max bots per symbol</label>
            <input
              id="risk-maxbotsymbol"
              type="number"
              value={form.maxBotsPerSymbol}
              disabled={!isAdmin}
              onChange={(e) => setForm((f) => ({ ...f, maxBotsPerSymbol: e.target.value }))}
              className="input num disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="risk-loss" className="label">Max daily loss (%)</label>
            <input
              id="risk-loss"
              type="number"
              step="0.01"
              value={form.maxDailyLossPercent}
              disabled={!isAdmin}
              onChange={(e) => setForm((f) => ({ ...f, maxDailyLossPercent: e.target.value }))}
              className="input num disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="risk-exposure" className="label">Max quote exposure (global)</label>
            <input
              id="risk-exposure"
              value={form.maxQuoteExposureGlobal}
              disabled={!isAdmin}
              onChange={(e) => setForm((f) => ({ ...f, maxQuoteExposureGlobal: e.target.value }))}
              className="input num disabled:opacity-50"
            />
          </div>
        </div>
      </Card>

      {/* Live trading flag */}
      <Card>
        <CardHeader title="Live trading gate" />
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-md">
              <p className="text-sm font-medium text-ink">Allow live trading (global flag)</p>
              <p className="mt-1 text-sm text-ink-dim leading-relaxed">
                Even when allowed here, live bots additionally require ENABLE_LIVE_TRADING=true in
                the API/worker environment and a live-enabled exchange account.
              </p>
            </div>
            <Button
              variant={risk?.allowLiveTrading ? 'danger' : 'primary'}
              disabled={!isAdmin || !liveEnv}
              title={!liveEnv ? 'ENABLE_LIVE_TRADING is false in the environment' : undefined}
              onClick={() => {
                api
                  .updateRiskSettings({ allowLiveTrading: !(risk?.allowLiveTrading ?? false) })
                  .then(refresh)
                  .catch((err) => setError(err?.message || 'Failed'));
              }}
            >
              {risk?.allowLiveTrading ? 'Disable live trading' : 'Allow live trading'}
            </Button>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-down/25 bg-down/[0.07] px-4 py-3">
            <svg className="w-5 h-5 shrink-0 text-down mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
            </svg>
            <p className="text-sm text-down leading-relaxed">
              <strong className="font-semibold">Risk warning: </strong>
              live trading places real orders with real funds. Grid bots can lose money in trending
              markets. Test thoroughly in dry-run mode first.
            </p>
          </div>
        </div>
      </Card>

      {/* Kill switch */}
      <Card className={killActive ? 'ring-2 ring-down/60' : ''}>
        <CardHeader
          title={
            <span className="flex items-center gap-2.5">
              Emergency kill switch
              {killActive && (
                <span className="badge bg-down/15 text-down ring-down/30">
                  <span className="glow-dot bg-down animate-pulse-dot" />
                  Active
                </span>
              )}
            </span>
          }
        />
        <div className="p-5 space-y-4">
          <p className="text-sm text-ink-dim leading-relaxed max-w-2xl">
            Activating the kill switch blocks new orders on every bot, commands all running bots to
            stop, and marks them KILLED. It persists until deactivated.
          </p>
          <Button
            variant={killActive ? 'success' : 'danger'}
            disabled={!isAdmin || killBusy}
            onClick={() => setKillConfirm(!killActive)}
          >
            {killBusy
              ? 'Working…'
              : killActive
                ? 'Deactivate kill switch'
                : 'Activate kill switch (stop all bots)'}
          </Button>
        </div>
      </Card>

      <ConfirmModal
        open={killConfirm !== null}
        title={killConfirm ? 'Activate kill switch' : 'Deactivate kill switch'}
        message={
          killConfirm
            ? 'This will cancel open orders and stop ALL running bots immediately. Continue?'
            : 'Deactivate the kill switch? Bots will NOT restart automatically — start them again from the Bots page.'
        }
        danger={Boolean(killConfirm)}
        confirmLabel={killConfirm ? 'Activate' : 'Deactivate'}
        busy={killBusy}
        onCancel={() => setKillConfirm(null)}
        onConfirm={() => void toggleKillSwitch(Boolean(killConfirm))}
      />
    </div>
  );
}
