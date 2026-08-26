/**
 * User-configurable, non-critical display preferences.
 *
 * These settings only ever affect *decorative* text (e.g. pagination copy).
 * Financial figures (prices, quantities, balances, PnL) are ALWAYS rendered
 * with Western (Latin) digits regardless of these preferences — see
 * docs/ASSUMPTIONS.md ("Digit style & calendar defaults").
 */

export type DigitStyle = 'latin' | 'persian';
export type CalendarSystem = 'gregorian' | 'jalali';

export interface DisplayPreferences {
  digitStyle: DigitStyle;
  calendar: CalendarSystem;
}

export const DEFAULT_PREFERENCES: DisplayPreferences = {
  digitStyle: 'latin',
  calendar: 'gregorian',
};

const STORAGE_KEY = '***';

let current: DisplayPreferences = { ...DEFAULT_PREFERENCES };
let loaded = false;
const listeners = new Set<() => void>();

function isDigitStyle(v: unknown): v is DigitStyle {
  return v === 'latin' || v === 'persian';
}

function isCalendarSystem(v: unknown): v is CalendarSystem {
  return v === 'gregorian' || v === 'jalali';
}

function readStored(): DisplayPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFERENCES };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<DisplayPreferences>;
    return {
      digitStyle: isDigitStyle(parsed.digitStyle) ? parsed.digitStyle : 'latin',
      calendar: isCalendarSystem(parsed.calendar) ? parsed.calendar : 'gregorian',
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

/** Imperative getter (safe in SSR): returns the current preferences. */
export function getPreferences(): DisplayPreferences {
  if (!loaded) {
    current = readStored();
    loaded = true;
  }
  return current;
}

/** Update preferences, persist them, and notify subscribers. */
export function setPreferences(next: Partial<DisplayPreferences>): DisplayPreferences {
  current = {
    digitStyle: next.digitStyle ?? current.digitStyle,
    calendar: next.calendar ?? current.calendar,
  };
  loaded = true;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      /* storage unavailable */
    }
  }
  listeners.forEach((fn) => fn());
  return current;
}

export function subscribePreferences(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
