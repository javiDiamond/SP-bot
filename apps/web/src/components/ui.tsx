'use client';

import type { ReactNode } from 'react';
import type { BotStatus } from '../lib/types';

/* ---------- Brand ---------- */

export function BrandMark({ size = 28, withText = false }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect x="1" y="1" width="30" height="30" rx="8" fill="rgba(45,212,160,0.10)" stroke="rgba(45,212,160,0.45)" />
        <path d="M7 20l4.5-5 3.5 3.5L20.5 11 25 16" stroke="#2DD4A0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7" cy="20" r="1.6" fill="#2DD4A0" />
        <circle cx="25" cy="16" r="1.6" fill="#2DD4A0" />
        <path d="M7 24.5h18" stroke="rgba(232,237,245,0.35)" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2.5 3" />
      </svg>
      {withText && (
        <span className="leading-none">
          <span className="block text-[15px] font-semibold tracking-tight text-ink">Wallex Grid Bot</span>
          <span className="block mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint">Spot Grid Engine</span>
        </span>
      )}
    </span>
  );
}

/* ---------- Cards ---------- */

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="card-head">
      <div>
        <h3 className="card-title">{title}</h3>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h2 className="page-title">{title}</h2>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

/* ---------- Stats ---------- */

const toneIcon: Record<string, ReactNode> = {
  blue: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h2.5l2-5 3.5 10 2.5-6.5L17 12h2" />
    </svg>
  ),
  green: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8M21 7v5m0-5h-5" />
    </svg>
  ),
  purple: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10m0 0l-3.5-3.5M17 8l-3.5 3.5M17 16H7m0 0l3.5-3.5M7 16l3.5 3.5" />
    </svg>
  ),
  yellow: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L1.8 18.1a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
    </svg>
  ),
  red: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
    </svg>
  ),
};

const toneChip: Record<string, string> = {
  blue: 'bg-info/10 text-info ring-info/25',
  green: 'bg-up/10 text-up ring-up/25',
  purple: 'bg-violet/10 text-violet ring-violet/25',
  yellow: 'bg-warn/10 text-warn ring-warn/25',
  red: 'bg-down/10 text-down ring-down/25',
};

export function StatCard({
  label,
  value,
  sub,
  tone = 'blue',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
}) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ring-1 ring-inset ${toneChip[tone]}`}>
        {toneIcon[tone]}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-ink num truncate">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-ink-dim num truncate">{sub}</p>}
      </div>
    </div>
  );
}

/* ---------- Badges ---------- */

const statusColors: Record<BotStatus, string> = {
  DRAFT: 'bg-white/[0.05] text-ink-dim ring-white/10',
  STARTING: 'bg-info/10 text-info ring-info/25',
  RUNNING: 'bg-up/10 text-up ring-up/25',
  PAUSING: 'bg-warn/10 text-warn ring-warn/25',
  PAUSED: 'bg-warn/10 text-warn ring-warn/25',
  STOPPING: 'bg-orange-400/10 text-orange-400 ring-orange-400/25',
  STOPPED: 'bg-white/[0.05] text-ink-dim ring-white/10',
  ERROR: 'bg-down/10 text-down ring-down/25',
  RANGE_EXITED: 'bg-violet/10 text-violet ring-violet/25',
  KILLED: 'bg-down/15 text-down ring-down/30',
};

const statusDot: Partial<Record<BotStatus, string>> = {
  RUNNING: 'bg-up animate-pulse-dot',
  STARTING: 'bg-info animate-pulse-dot',
  PAUSING: 'bg-warn',
  PAUSED: 'bg-warn',
  ERROR: 'bg-down',
  KILLED: 'bg-down',
};

export function StatusBadge({ status }: { status: BotStatus }) {
  return (
    <span className={`badge ${statusColors[status] || statusColors.DRAFT}`}>
      {statusDot[status] && <span className={`glow-dot ${statusDot[status]}`} />}
      {status.replace('_', ' ')}
    </span>
  );
}

export function ModeBadge({ mode }: { mode: 'DRY_RUN' | 'LIVE' }) {
  return mode === 'LIVE' ? (
    <span className="badge bg-down/10 text-down ring-down/25">
      <span className="glow-dot bg-down animate-pulse-dot" />
      Live
    </span>
  ) : (
    <span className="badge bg-warn/10 text-warn ring-warn/25">Dry Run</span>
  );
}

export function SideBadge({ side }: { side: 'BUY' | 'SELL' }) {
  return (
    <span
      className={`badge ${side === 'BUY' ? 'bg-up/10 text-up ring-up/25' : 'bg-down/10 text-down ring-down/25'}`}
    >
      {side}
    </span>
  );
}

export function LevelBadge({ level }: { level: string }) {
  const cls =
    level === 'ERROR'
      ? 'bg-down/10 text-down ring-down/25'
      : level === 'WARN'
        ? 'bg-warn/10 text-warn ring-warn/25'
        : 'bg-info/10 text-info ring-info/25';
  return <span className={`badge ${cls}`}>{level}</span>;
}

/* ---------- Buttons ---------- */

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
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    success: 'btn-up',
    ghost: 'btn-ghost',
  };
  const sizes: Record<string, string> = {
    sm: 'btn-sm',
    md: 'btn-md',
  };
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </button>
  );
}

/* ---------- Feedback ---------- */

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="h-8 w-8 rounded-full border-2 border-edge-strong border-t-accent animate-spin" />
      {label && <p className="text-xs text-ink-faint">{label}</p>}
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
      <svg className="w-8 h-8 text-ink-faint/70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m16 0h-5l-1.5 2h-3L9 13H4"
        />
      </svg>
      <p className="text-sm text-ink-dim max-w-sm">{message}</p>
      {action}
    </div>
  );
}

export function ErrorBanner({ message }: { message: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-down/25 bg-down/[0.07] px-4 py-3">
      <svg className="w-5 h-5 shrink-0 text-down mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
      </svg>
      <p className="text-sm text-down">{message}</p>
    </div>
  );
}

export function Notice({ tone = 'info', message }: { tone?: 'info' | 'warn' | 'success'; message: ReactNode }) {
  const tones = {
    info: 'border-info/25 bg-info/[0.06] text-info',
    warn: 'border-warn/25 bg-warn/[0.06] text-warn',
    success: 'border-up/25 bg-up/[0.06] text-up',
  };
  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${tones[tone]}`}>
      <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="text-sm leading-relaxed [&_strong]:font-semibold">{message}</div>
    </div>
  );
}

/* ---------- Modals ---------- */

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
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-deep/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card shadow-pop max-w-md w-full mx-4 animate-[fadeIn_.15s_ease-out]">
        <div className="card-head">
          <h3 className="card-title">{title}</h3>
        </div>
        <div className="px-5 py-4 text-sm text-ink-dim leading-relaxed">{children}</div>
        {actions && <div className="px-5 py-4 border-t border-edge flex justify-end gap-3">{actions}</div>}
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
