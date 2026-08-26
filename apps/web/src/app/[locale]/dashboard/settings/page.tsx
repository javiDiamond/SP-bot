'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { usePreferences } from '@/lib/usePreferences';
import { fmtCount } from '@/lib/format';
import { Button, Card, CardHeader, ConfirmModal, ErrorBanner, Notice, PageHeader, Spinner } from '@/components/ui';
import type { SystemStatusData } from '@/lib/types';

function ServicePill({ ok, okLabel, badLabel }: { ok: boolean; okLabel: string; badLabel: string }) {
  return (
    <span className={`badge ${ok ? 'bg-up/10 text-up ring-up/25' : 'bg-down/10 text-down ring-down/25'}`}>
      <span className={`glow-dot ${ok ? 'bg-up' : 'bg-down animate-pulse-dot'}`} />
      {ok ? okLabel : badLabel}
    </span>
  );
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tca = useTranslations('common.actions');
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const { preferences, update } = usePreferences();

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
      setError(err?.message || t('errSaveRisk'));
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
      setError(err?.message || t('errKillToggle'));
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
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {error && <ErrorBanner message={error} />}

      {!isAdmin && <Notice tone="info" message={t('readOnly')} />}

      {/* System status */}
      <Card>
        <CardHeader title={t('systemStatusTitle')} />
        <div className="p-5">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-deep/60 border border-edge px-4 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{t('database')}</dt>
              <dd className="mt-1.5">
                <ServicePill ok={Boolean(status?.services?.database)} okLabel={t('connected')} badLabel={t('down')} />
              </dd>
            </div>
            <div className="rounded-lg bg-deep/60 border border-edge px-4 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{t('redis')}</dt>
              <dd className="mt-1.5">
                <ServicePill ok={Boolean(status?.services?.redis)} okLabel={t('connected')} badLabel={t('down')} />
              </dd>
            </div>
            <div className="rounded-lg bg-deep/60 border border-edge px-4 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{t('liveEnv')}</dt>
              <dd className="mt-1.5">
                <span className={`badge ${liveEnv ? 'bg-down/10 text-down ring-down/25' : 'bg-up/10 text-up ring-up/25'}`}>
                  <span dir="ltr">
                    {liveEnv ? 'ENABLE_LIVE_TRADING=true' : 'ENABLE_LIVE_TRADING=false'}
                  </span>
                </span>
              </dd>
            </div>
            <div className="rounded-lg bg-deep/60 border border-edge px-4 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{t('allowLiveDb')}</dt>
              <dd className="mt-1.5">
                <ServicePill ok={!risk?.allowLiveTrading} okLabel={t('blocked')} badLabel={t('allowed')} />
              </dd>
            </div>
            {queueDepths && (
              <div className="rounded-lg bg-deep/60 border border-edge px-4 py-3 sm:col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{t('queueDepths')}</dt>
                <dd className="mt-1.5 text-sm text-ink-dim num">
                  {Object.entries(queueDepths)
                    .map(([q, d]) => `${q}: ${fmtCount(d)}`)
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
          title={t('riskTitle')}
          actions={
            isAdmin && (
              <Button size="sm" onClick={saveRiskSettings} disabled={saving}>
                {saving ? tca('saving') : tca('save')}
              </Button>
            )
          }
        />
        <div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="risk-maxbots" className="label">{t('maxBotsGlobal')}</label>
            <input
              id="risk-maxbots"
              type="number"
              value={form.maxBotsGlobal}
              disabled={!isAdmin}
              onChange={(e) => setForm((f) => ({ ...f, maxBotsGlobal: e.target.value }))}
              className="input num disabled:opacity-50"
              dir="ltr"
            />
          </div>
          <div>
            <label htmlFor="risk-maxbotsymbol" className="label">{t('maxBotsPerSymbol')}</label>
            <input
              id="risk-maxbotsymbol"
              type="number"
              value={form.maxBotsPerSymbol}
              disabled={!isAdmin}
              onChange={(e) => setForm((f) => ({ ...f, maxBotsPerSymbol: e.target.value }))}
              className="input num disabled:opacity-50"
              dir="ltr"
            />
          </div>
          <div>
            <label htmlFor="risk-loss" className="label">{t('maxDailyLoss')}</label>
            <input
              id="risk-loss"
              type="number"
              step="0.01"
              value={form.maxDailyLossPercent}
              disabled={!isAdmin}
              onChange={(e) => setForm((f) => ({ ...f, maxDailyLossPercent: e.target.value }))}
              className="input num disabled:opacity-50"
              dir="ltr"
            />
          </div>
          <div>
            <label htmlFor="risk-exposure" className="label">{t('maxQuoteExposure')}</label>
            <input
              id="risk-exposure"
              value={form.maxQuoteExposureGlobal}
              disabled={!isAdmin}
              onChange={(e) => setForm((f) => ({ ...f, maxQuoteExposureGlobal: e.target.value }))}
              className="input num disabled:opacity-50"
              dir="ltr"
            />
          </div>
        </div>
      </Card>

      {/* Live trading flag */}
      <Card>
        <CardHeader title={t('liveGateTitle')} />
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-md">
              <p className="text-sm font-medium text-ink">{t('allowLiveTitle')}</p>
              <p className="mt-1 text-sm text-ink-dim leading-relaxed">{t('allowLiveBody')}</p>
            </div>
            <Button
              variant={risk?.allowLiveTrading ? 'danger' : 'primary'}
              disabled={!isAdmin || !liveEnv}
              title={!liveEnv ? t('envDisabledTitle') : undefined}
              onClick={() => {
                api
                  .updateRiskSettings({ allowLiveTrading: !(risk?.allowLiveTrading ?? false) })
                  .then(refresh)
                  .catch((err) => setError(err?.message || t('errGeneric')));
              }}
            >
              {risk?.allowLiveTrading ? t('disableLive') : t('enableLive')}
            </Button>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-down/25 bg-down/[0.07] px-4 py-3">
            <svg className="w-5 h-5 shrink-0 text-down mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
            </svg>
            <p className="text-sm text-down leading-relaxed">
              <strong className="font-semibold">{t('riskWarnTitle')}</strong>
              {t('riskWarnBody')}
            </p>
          </div>
        </div>
      </Card>

      {/* Kill switch */}
      <Card className={killActive ? 'ring-2 ring-down/60' : ''}>
        <CardHeader
          title={
            <span className="flex items-center gap-2.5">
              {t('killTitle')}
              {killActive && (
                <span className="badge bg-down/15 text-down ring-down/30">
                  <span className="glow-dot bg-down animate-pulse-dot" />
                  {t('killActiveBadge')}
                </span>
              )}
            </span>
          }
        />
        <div className="p-5 space-y-4">
          <p className="text-sm text-ink-dim leading-relaxed max-w-2xl">{t('killBody')}</p>
          <Button
            variant={killActive ? 'success' : 'danger'}
            disabled={!isAdmin || killBusy}
            onClick={() => setKillConfirm(!killActive)}
          >
            {killBusy
              ? tca('working')
              : killActive
                ? t('killDeactivate')
                : t('killActivate')}
          </Button>
        </div>
      </Card>

      {/* Display preferences (decorative only) */}
      <Card>
        <CardHeader title={t('prefsTitle')} subtitle={t('prefsSub')} />
        <div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pref-digits" className="label">{t('digitStyleLabel')}</label>
            <select
              id="pref-digits"
              value={preferences.digitStyle}
              onChange={(e) => update({ digitStyle: e.target.value as 'latin' | 'persian' })}
              className="select"
            >
              <option value="latin">{t('digitStyleLatin')}</option>
              <option value="persian">{t('digitStylePersian')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="pref-calendar" className="label">{t('calendarLabel')}</label>
            <select
              id="pref-calendar"
              value={preferences.calendar}
              onChange={(e) => update({ calendar: e.target.value as 'gregorian' | 'jalali' })}
              className="select"
            >
              <option value="gregorian">{t('calendarGregorian')}</option>
              <option value="jalali">{t('calendarJalali')}</option>
            </select>
          </div>
        </div>
      </Card>

      <ConfirmModal
        open={killConfirm !== null}
        title={killConfirm ? t('killConfirmActivateTitle') : t('killConfirmDeactivateTitle')}
        message={killConfirm ? t('killConfirmActivateMsg') : t('killConfirmDeactivateMsg')}
        danger={Boolean(killConfirm)}
        confirmLabel={killConfirm ? t('activate') : t('deactivate')}
        busy={killBusy}
        onCancel={() => setKillConfirm(null)}
        onConfirm={() => void toggleKillSwitch(Boolean(killConfirm))}
      />
    </div>
  );
}
