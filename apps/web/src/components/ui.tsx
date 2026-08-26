'use client';

import type { ReactNode } from 'react';
import type { BotStatus } from '../lib/types';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function StatCard({ label, value, sub, tone = 'blue' }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' }) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };
  return (
    <Card>
      <div className="p-5 flex items-center">
        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${tones[tone]}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div className="ml-4 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 truncate">{value}</p>
          {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

const statusColors: Record<BotStatus, string> = {
  DRAFT: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  STARTING: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  RUNNING: 'bg-green-50 text-green-700 ring-green-600/20',
  PAUSING: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  PAUSED: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
  STOPPING: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  STOPPED: 'bg-gray-50 text-gray-700 ring-gray-500/20',
  ERROR: 'bg-red-50 text-red-700 ring-red-600/20',
  RANGE_EXITED: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  KILLED: 'bg-red-50 text-red-800 ring-red-700/30',
};

export function StatusBadge({ status }: { status: BotStatus }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[status] || statusColors.DRAFT}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function ModeBadge({ mode }: { mode: 'DRY_RUN' | 'LIVE' }) {
  return mode === 'LIVE' ? (
    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
      LIVE
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
      DRY RUN
    </span>
  );
}

export function SideBadge({ side }: { side: 'BUY' | 'SELL' }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${
        side === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {side}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  type = 'button',
  title,
}: {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md';
  disabled?: boolean;
  type?: 'button' | 'submit';
  title?: string;
}) {
  const variants: Record<string, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 border-transparent',
    secondary: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 border-transparent',
    success: 'bg-green-600 text-white hover:bg-green-700 border-transparent',
    ghost: 'bg-transparent text-gray-600 border-transparent hover:bg-gray-100',
  };
  const sizes: Record<string, string> = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1 border rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="text-center py-12 text-sm text-gray-500">{message}</div>;
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
  actions,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <div className="px-6 py-4 text-sm text-gray-600">{children}</div>
        {actions && (
          <div className="px-6 py-3 border-t border-gray-200 flex justify-end gap-3">{actions}</div>
        )}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
  busy = false,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      actions={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      {message}
    </Modal>
  );
}
