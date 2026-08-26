import type { DisplayPreferences } from './preferences';
import { getPreferences } from './preferences';

/**
 * Locale-aware number/date formatting.
 *
 * Conventions (see docs/ASSUMPTIONS.md):
 *  - Financial figures (prices, quantities, balances, PnL) ALWAYS use Western
 *    Arabic digits (0-9), even in the Persian locale, via `numberingSystem:'latn'`.
 *  - Gregorian calendar is the default; Jalali is an explicit opt-in preference
 *    applied only to date displays (never to financial figures).
 *  - Currency/ticker symbols (USDT, BTC, ...) are never translated.
 *
 * The active locale is supplied at render time by `<FormatContextSync/>`
 * (see providers.tsx) so that both SSR and client renders use the same locale.
 */

export interface FormatContext {
  locale: 'en' | 'fa' | string;
  prefs: DisplayPreferences;
}

let activeContext: FormatContext = { locale: 'en', prefs: { ...getPreferences() } };

/** Synchronously set the formatting context (called during render). */
export function setFormatContext(ctx: FormatContext): void {
  activeContext = ctx;
}

export function getFormatContext(): FormatContext {
  return activeContext;
}

const DASH = '—';

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Build an Intl.NumberFormat. Financial output always forces Latin digits via
 * the `nu-latn` locale extension, regardless of the active locale.
 */
function makeNumberFormat(forceLatin: boolean, opts: Intl.NumberFormatOptions): Intl.NumberFormat {
  const base = activeContext.locale === 'fa' ? 'fa' : 'en-US';
  const locale = forceLatin ? `${base}-u-nu-latn` : base;
  return new Intl.NumberFormat(locale, opts);
}

/**
 * Financial number: ALWAYS Western digits, locale-appropriate grouping/decimal.
 * Used for prices, quantities, balances, PnL, percentages and anything where
 * precision matters.
 */
export function fmtNum(value: string | number | null | undefined, decimals = 2): string {
  const n = toNumber(value);
  if (n === null) return DASH;
  if (Math.abs(n) >= 1_000_000) {
    return makeNumberFormat(true, { maximumFractionDigits: 0 }).format(n);
  }
  return makeNumberFormat(true, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(n);
}

/**
 * Non-financial / decorative number that honours the user's digit-style
 * preference (e.g. pagination "page 3 of 10"). Never use for trading figures.
 */
export function fmtCount(value: number): string {
  const { digitStyle, calendar: _calendar } = activeContext.prefs;
  const usePersian = activeContext.locale === 'fa' && digitStyle === 'persian';
  return makeNumberFormat(!usePersian, { maximumFractionDigits: 0 }).format(value);
}

export function fmtPnl(value: string | number | null | undefined): string {
  const n = toNumber(value);
  if (n === null) return DASH;
  const sign = n > 0 ? '+' : '';
  return `${sign}${fmtNum(n, 4)}`;
}

/** Resolve the calendar system for date displays based on user preference. */
function calendarOption(): Intl.DateTimeFormatOptions['calendar'] {
  return activeContext.prefs.calendar === 'jalali' && activeContext.locale === 'fa'
    ? 'persian'
    : 'gregory';
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  const base = activeContext.locale === 'fa' ? 'fa' : 'en-US';
  const locale = `${base}-u-nu-latn`;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    calendar: calendarOption(),
  }).format(d);
}

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  const base = activeContext.locale === 'fa' ? 'fa' : 'en-US';
  const locale = `${base}-u-nu-latn`;
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    calendar: calendarOption(),
  }).format(d);
}

/** Compact timestamp for chart axis ticks (locale-aware, Latin digits). */
export function fmtAxisTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const base = activeContext.locale === 'fa' ? 'fa' : 'en-US';
  const locale = `${base}-u-nu-latn`;
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    calendar: calendarOption(),
  }).format(d);
}

export function pnlClass(value: string | number | null | undefined): string {
  const n = toNumber(value);
  if (n === null || n === 0) return 'text-ink-dim';
  return n > 0 ? 'text-up' : 'text-down';
}

export function shortId(id: string): string {
  return id ? id.slice(0, 8) : DASH;
}

/**
 * Relative "time ago" using ICU plurals is handled in components via
 * translations; this returns the raw elapsed bucket so callers can pick the
 * correct ICU message. Kept for backwards compatibility.
 */
export function timeAgo(ts: number | string): string {
  const t = typeof ts === 'number' ? ts : new Date(ts).getTime();
  const diff = Date.now() - t;
  if (diff < 5_000) return 'just now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
