'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { fmtDate } from '../../../lib/format';
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
} from '../../../components/ui';
import type { ExchangeAccountRow } from '../../../lib/types';

export default function ExchangePage() {
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
    if (!form.name.trim() || !form.apiKey.trim()) return setError('Name and API key are required');
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
      setError(err?.message || 'Failed to create account');
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
      setError(err?.message || 'Failed to update account');
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
      alert(err?.message || 'Delete failed');
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  };

  const openAdd = () => {
    setForm({ name: '', apiKey: '', subAccountClientId: '' });
    setShowAdd(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exchange Accounts"
        subtitle="Wallex API credentials — encrypted at rest, masked everywhere."
        actions={<Button onClick={openAdd}>Add Exchange Account</Button>}
      />

      <div className="flex items-start gap-3 rounded-lg border border-down/25 bg-down/[0.07] px-4 py-3">
        <svg className="w-5 h-5 shrink-0 text-down mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3l9 16H3l9-16z" />
        </svg>
        <p className="text-sm text-down leading-relaxed">
          <strong className="font-semibold">Security Notice: </strong>
          create API keys with only Read and Trade permissions. <strong>Do NOT</strong> enable
          withdrawal permissions. Keys are stored encrypted (AES-256-GCM) and never logged.
        </p>
      </div>

      {error && !showAdd && !editAccount && <ErrorBanner message={error} />}

      {isLoading ? (
        <Spinner />
      ) : (accounts || []).length === 0 ? (
        <Card>
          <EmptyState
            message="No exchange account configured. Add your Wallex API credentials to enable live trading or balance snapshots."
            action={<Button onClick={openAdd}>Add Exchange Account</Button>}
          />
        </Card>
      ) : (
        <Card>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>API Key</th>
                  <th>Sub-account</th>
                  <th>Live enabled</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(accounts || []).map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium text-ink">{a.name}</td>
                    <td className="font-mono text-xs text-ink-dim">{a.apiKeyMasked}</td>
                    <td>{a.subAccountClientId || '—'}</td>
                    <td>
                      {a.isLiveEnabled ? (
                        <span className="badge bg-down/10 text-down ring-down/25">
                          <span className="glow-dot bg-down animate-pulse-dot" />
                          Live
                        </span>
                      ) : (
                        <span className="badge badge-neutral">dry-run only</span>
                      )}
                    </td>
                    <td>
                      <span className={a.isActive ? 'text-up' : 'text-ink-faint'}>
                        {a.isActive ? 'active' : 'inactive'}
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
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(a)}>
                          Delete
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
        <CardHeader title="How to get your Wallex API key" />
        <div className="p-6">
          <ol className="space-y-2.5 text-sm text-ink-dim">
            {[
              <>Log in to your Wallex Exchange account</>,
              <>Navigate to Settings → API Management</>,
              <>Click “Create New API Key”</>,
              <>Enable only <strong className="text-ink">Read</strong> and <strong className="text-ink">Trade</strong> permissions</>,
              <><strong className="text-down font-semibold">DO NOT</strong> enable Withdrawal permissions</>,
              <>Copy the API key and add it above</>,
            ].map((item, i) => (
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
        title={editAccount ? `Edit ${editAccount.name}` : 'Add exchange account'}
        onClose={() => {
          setShowAdd(false);
          setEditAccount(null);
          setError('');
        }}
      >
        <form onSubmit={editAccount ? handleEdit : handleAdd} className="space-y-4">
          {error && <ErrorBanner message={error} />}
          <div>
            <label htmlFor="acc-name" className="label">Account name</label>
            <input
              id="acc-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
              placeholder="Main Wallex account"
            />
          </div>
          <div>
            <label htmlFor="acc-key" className="label">
              API key {editAccount && <span className="normal-case text-ink-faint">(leave blank to keep current)</span>}
            </label>
            <input
              id="acc-key"
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              className="input font-mono"
              placeholder={editAccount ? '••••••••' : 'Paste your Wallex API key'}
              autoComplete="off"
            />
            {!editAccount && (
              <p className="field-hint">
                Stored encrypted; displayed masked. Never logged or sent anywhere else.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="acc-sub" className="label">
              Sub-account client ID <span className="normal-case text-ink-faint">(optional)</span>
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
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : editAccount ? 'Save changes' : 'Add account'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete exchange account"
        message={`Delete "${deleteTarget?.name}"? Bots using this account in dry-run are unaffected; live trading for this account becomes impossible.`}
        danger
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
