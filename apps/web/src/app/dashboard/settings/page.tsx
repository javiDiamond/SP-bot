'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';
import { Button, Card, CardHeader, ConfirmModal, ErrorBanner, Spinner } from '../../../components/ui';
import type { SystemStatusData } from '../../../lib/types';

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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">Global risk controls and emergency switches</p>
      </div>

      {error && <ErrorBanner message={error} />}

      {!isAdmin && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-md text-sm text-blue-700">
          Read-only view — risk settings and the kill switch require the ADMIN role.
        </div>
      )}

      {/* System status */}
      <Card>
        <CardHeader title="System status" />
        <div className="p-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-gray-50 px-4 py-3 rounded-md">
              <dt className="text-sm font-medium text-gray-500">Database</dt>
              <dd className="mt-1 text-sm">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    status?.services?.database ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {status?.services?.database ? 'Connected' : 'Down'}
                </span>
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-3 rounded-md">
              <dt className="text-sm font-medium text-gray-500">Redis</dt>
              <dd className="mt-1 text-sm">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    status?.services?.redis ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {status?.services?.redis ? 'Connected' : 'Down'}
                </span>
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-3 rounded-md">
              <dt className="text-sm font-medium text-gray-500">Live trading (environment)</dt>
              <dd className="mt-1 text-sm">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    liveEnv ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {liveEnv ? 'ENABLE_LIVE_TRADING=true' : 'ENABLE_LIVE_TRADING=false'}
                </span>
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-3 rounded-md">
              <dt className="text-sm font-medium text-gray-500">Allow live trading (DB)</dt>
              <dd className="mt-1 text-sm">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    risk?.allowLiveTrading ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {risk?.allowLiveTrading ? 'Allowed' : 'Blocked'}
                </span>
              </dd>
            </div>
            {queueDepths && (
              <div className="bg-gray-50 px-4 py-3 rounded-md sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Queue depths</dt>
                <dd className="mt-1 text-sm text-gray-700">
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
        <div className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max bots (global)</label>
            <input
              type="number"
              value={form.maxBotsGlobal}
              disabled={!isAdmin}
              onChange={(e) => setForm((f) => ({ ...f, maxBotsGlobal: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max bots per symbol</label>
            <input
              type="number"
              value={form.maxBotsPerSymbol}
              disabled={!isAdmin}
              onChange={(e) => setForm((f) => ({ ...f, maxBotsPerSymbol: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max daily loss (%)</label>
            <input
              type="number"
              step="0.01"
              value={form.maxDailyLossPercent}
              disabled={!isAdmin}
              onChange={(e) => setForm((f) => ({ ...f, maxDailyLossPercent: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max quote exposure (global)
            </label>
            <input
              value={form.maxQuoteExposureGlobal}
              disabled={!isAdmin}
              onChange={(e) => setForm((f) => ({ ...f, maxQuoteExposureGlobal: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
            />
          </div>
        </div>
      </Card>

      {/* Live trading flag */}
      <Card>
        <CardHeader title="Live trading gate" />
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Allow live trading (global flag)</p>
              <p className="text-sm text-gray-500">
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
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <p className="text-sm text-red-700">
              <strong className="font-medium">Risk warning: </strong>
              live trading places real orders with real funds. Grid bots can lose money in trending
              markets. Test thoroughly in dry-run mode first.
            </p>
          </div>
        </div>
      </Card>

      {/* Kill switch */}
      <Card className={killActive ? 'ring-2 ring-red-500' : ''}>
        <CardHeader title="Emergency kill switch" />
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
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
