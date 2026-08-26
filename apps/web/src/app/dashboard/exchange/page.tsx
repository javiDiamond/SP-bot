'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { fmtDate } from '../../../lib/format';
import { Button, Card, CardHeader, ConfirmModal, ErrorBanner, Modal, Spinner } from '../../../components/ui';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exchange Accounts</h2>
          <p className="mt-1 text-sm text-gray-500">
            Wallex API credentials — encrypted at rest, masked everywhere.
          </p>
        </div>
        <Button
          onClick={() => {
            setForm({ name: '', apiKey: '', subAccountClientId: '' });
            setShowAdd(true);
          }}
        >
          Add Exchange Account
        </Button>
      </div>

      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
        <p className="text-sm text-red-700">
          <strong className="font-medium">Security Notice: </strong>
          create API keys with only Read and Trade permissions. <strong>Do NOT</strong> enable
          withdrawal permissions. Keys are stored encrypted (AES-256-GCM) and never logged.
        </p>
      </div>

      {error && !showAdd && !editAccount && <ErrorBanner message={error} />}

      {isLoading ? (
        <Spinner />
      ) : (accounts || []).length === 0 ? (
        <Card>
          <div className="px-6 py-12 text-center">
            <h3 className="text-sm font-medium text-gray-900">No exchange account configured</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add your Wallex API credentials to enable live trading or balance snapshots.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => {
                  setForm({ name: '', apiKey: '', subAccountClientId: '' });
                  setShowAdd(true);
                }}
              >
                Add Exchange Account
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">API Key</th>
                  <th className="px-6 py-3">Sub-account</th>
                  <th className="px-6 py-3">Live enabled</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {(accounts || []).map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{a.name}</td>
                    <td className="px-6 py-3 font-mono text-xs">{a.apiKeyMasked}</td>
                    <td className="px-6 py-3">{a.subAccountClientId || '—'}</td>
                    <td className="px-6 py-3">
                      {a.isLiveEnabled ? (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700">
                          LIVE
                        </span>
                      ) : (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                          dry-run only
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">{a.isActive ? 'active' : 'inactive'}</td>
                    <td className="px-6 py-3 text-gray-500">{fmtDate(a.createdAt)}</td>
                    <td className="px-6 py-3">
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
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Log in to your Wallex Exchange account</li>
            <li>Navigate to Settings → API Management</li>
            <li>Click “Create New API Key”</li>
            <li>Enable only <strong>Read</strong> and <strong>Trade</strong> permissions</li>
            <li>
              <strong className="text-red-600">DO NOT</strong> enable Withdrawal permissions
            </li>
            <li>Copy the API key and add it above</li>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Account name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Main Wallex account"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API key {editAccount && <span className="text-gray-400">(leave blank to keep current)</span>}
            </label>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder={editAccount ? '••••••••' : 'Paste your Wallex API key'}
              autoComplete="off"
            />
            {!editAccount && (
              <p className="mt-1 text-xs text-gray-400">
                Stored encrypted; displayed masked. Never logged or sent anywhere else.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sub-account client ID <span className="text-gray-400">(optional)</span>
            </label>
            <input
              value={form.subAccountClientId}
              onChange={(e) => setForm((f) => ({ ...f, subAccountClientId: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
