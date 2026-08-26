'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import {
  Button,
  Card,
  CardHeader,
  ConfirmModal,
  EmptyState,
  ErrorBanner,
  Modal,
  PageHeader,
  Spinner,
} from '@/components/ui';
import type { ExchangeAccountRow } from '@/lib/types';

export default function ExchangePage() {
  const t = useTranslations('exchange');
  const tc = useTranslations('common.actions');
  const tcommon = useTranslations('common');
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editAccount, setEditAccount] = useState<ExchangeAccountRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExchangeAccountRow | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({ name: '', apiKey: '', subAccountClientId: '' });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => (await api.accounts()).data as ExchangeAccountRow[],
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['accounts'] });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.apiKey.trim()) return setError(t('errNameKeyRequired'));
    setBusy(true);
    try {
      await api.createAccount({
        name: form.name.trim(),
        apiKey: form.apiKey.trim(),
        subAccountClientId: form.subAccountClientId.trim() || undefined,
      });
      setShowAdd(false);
      setForm({ name: '', apiKey: '', subAccountClientId: '' });
      refresh();
    } catch (err: any) {
      setError(err?.message || t('errCreateFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccount) return;
    setError('');
    setBusy(true);
    try {
      const body: Record<string, unknown> = {};
      if (form.name.trim()) body.name = form.name.trim();
      if (form.apiKey.trim()) body.apiKey = form.apiKey.trim();
      if (form.subAccountClientId.trim()) body.subAccountClientId = form.subAccountClientId.trim();
      await api.updateAccount(editAccount.id, body);
      setEditAccount(null);
      setForm({ name: '', apiKey: '', subAccountClientId: '' });
      refresh();
    } catch (err: any) {
      setError(err?.message || t('errUpdateFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await api.deleteAccount(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } catch (err: any) {
      alert(err?.message || t('deleteFailed'));
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  };

  const openAdd = () => {
    setForm({ name: '', apiKey: '', subAccountClientId: '' });
    setShowAdd(true);
  };

  const howtoSteps: ReactNode[] = [
    t('howtoStep1'),
    t('howtoStep2'),
    t('howtoStep3'),
    <>
      {t('howtoStep4Pre')}
      <strong className="text-ink">{t('howtoStep4Read')}</strong>
      {t('howtoStep4And')}
      <strong className="text-ink">{t('howtoStep4Trade')}</strong>
      {t('howtoStep4Post')}
    </>,
    <>
      {t('howtoStep5Pre')}
      <strong className="text-down font-semibold">{t('howtoStep5Strong')}</strong>
      {t('howtoStep5Post')}
    </>,
    t('howtoStep6'),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={<Button onClick={openAdd}>{t('addAccount')}</Button>}
      />

      <div className="flex items-start gap-3 rounded-lg border border-down/25 bg-down/[0.07] px-4 py-3">
        <svg className="w-5 h-5 shrink-0 text-down mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3l9 16H3l9-16z" />
        </svg>
        <p className="text-sm text-down leading-relaxed">
          <strong className="font-semibold">{t('securityTitle')}</strong>
          {t('securityBody')}
          <strong>{t('securityDoNot')}</strong>
          {t('securityBodyEnd')}
        </p>
      </div>

      {error && !showAdd && !editAccount && <ErrorBanner message={error} />}

      {isLoading ? (
        <Spinner />
      ) : (accounts || []).length === 0 ? (
        <Card>
          <EmptyState message={t('empty')} action={<Button onClick={openAdd}>{t('addAccount')}</Button>} />
        </Card>
      ) : (
        <Card>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('thName')}</th>
                  <th>{t('thApiKey')}</th>
                  <th>{t('thSubAccount')}</th>
                  <th>{t('thLiveEnabled')}</th>
                  <th>{t('thStatus')}</th>
                  <th>{t('thCreated')}</th>
                  <th className="text-end">{t('thActions')}</th>
                </tr>
              </thead>
              <tbody>
                {(accounts || []).map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium text-ink">{a.name}</td>
                    <td className="font-mono text-xs text-ink-dim" dir="ltr">{a.apiKeyMasked}</td>
                    <td>{a.subAccountClientId || tcommon('dash')}</td>
                    <td>
                      {a.isLiveEnabled ? (
                        <span className="badge bg-down/10 text-down ring-down/25">
                          <span className="glow-dot bg-down animate-pulse-dot" />
                          {t('liveBadge')}
                        </span>
                      ) : (
                        <span className="badge badge-neutral">{t('dryRunOnly')}</span>
                      )}
                    </td>
                    <td>
                      <span className={a.isActive ? 'text-up' : 'text-ink-faint'}>
                        {a.isActive ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="text-ink-dim">{fmtDate(a.createdAt)}</td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setForm({ name: a.name, apiKey: '', subAccountClientId: a.subAccountClientId || '' });
                            setEditAccount(a);
                          }}
                        >
                          {tc('edit')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(a)}>
                          {tc('delete')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title={t('howtoTitle')} />
        <div className="p-6">
          <ol className="space-y-2.5 text-sm text-ink-dim">
            {howtoSteps.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-accent/12 ring-1 ring-accent/25 text-accent text-[11px] font-semibold flex items-center justify-center num">
                  {i + 1}
                </span>
                <span className="leading-6">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </Card>

      <Modal
        open={showAdd || editAccount !== null}
        title={editAccount ? t('modalEditTitle', { name: editAccount.name }) : t('modalAddTitle')}
        onClose={() => {
          setShowAdd(false);
          setEditAccount(null);
          setError('');
        }}
      >
        <form onSubmit={editAccount ? handleEdit : handleAdd} className="space-y-4">
          {error && <ErrorBanner message={error} />}
          <div>
            <label htmlFor="acc-name" className="label">{t('accountNameLabel')}</label>
            <input
              id="acc-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
              placeholder={t('accountNamePlaceholder')}
            />
          </div>
          <div>
            <label htmlFor="acc-key" className="label">
              {t('apiKeyLabel')}{' '}
              {editAccount && <span className="normal-case text-ink-faint">{t('apiKeyKeepHint')}</span>}
            </label>
            <input
              id="acc-key"
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              className="input font-mono"
              dir="ltr"
              placeholder={editAccount ? t('apiKeyPlaceholderEdit') : t('apiKeyPlaceholderAdd')}
              autoComplete="off"
            />
            {!editAccount && <p className="field-hint">{t('storageHint')}</p>}
          </div>
          <div>
            <label htmlFor="acc-sub" className="label">
              {t('subAccountLabel')} <span className="normal-case text-ink-faint">{tcommon('optional')}</span>
            </label>
            <input
              id="acc-sub"
              value={form.subAccountClientId}
              onChange={(e) => setForm((f) => ({ ...f, subAccountClientId: e.target.value }))}
              className="input"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAdd(false);
                setEditAccount(null);
                setError('');
              }}
            >
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? tc('saving') : editAccount ? t('saveChanges') : t('addAccountCta')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={deleteTarget !== null}
        title={t('deleteTitle')}
        message={t('deleteMessage', { name: deleteTarget?.name || '' })}
        danger
        confirmLabel={tc('delete')}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
