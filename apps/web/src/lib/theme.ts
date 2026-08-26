import { useCallback, useLayoutEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'wallex-theme';
const DEFAULT_THEME: Theme = 'dark';

function readStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const t = window.localStorage.getItem(STORAGE_KEY);
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    const initial = readStoredTheme() ?? DEFAULT_THEME;
    applyTheme(initial);
    setThemeState(initial);
    setMounted(true);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
    applyTheme(next);
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggle, mounted };
}

const SSR_FALLBACK: Record<string, string> = {
  '--deep': '10 14 21',
  '--panel': '15 20 29',
  '--raised': '19 26 38',
  '--overlay': '24 33 48',
  '--ink': '233 238 246',
  '--ink-dim': '148 163 184',
  '--ink-faint': '94 108 128',
  '--edge-tint': '148 163 184',
  '--accent': '45 212 160',
  '--accent-hover': '70 226 181',
  '--up': '52 211 153',
  '--down': '248 113 113',
  '--warn': '251 191 36',
  '--info': '56 189 248',
  '--violet': '167 139 250',
};

export function themeColor(varName: string, alpha?: number): string {
  let value = SSR_FALLBACK[varName];
  if (typeof document !== 'undefined') {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (raw) value = raw;
  }
  if (!value) return 'transparent';
  return alpha != null ? `rgb(${value} / ${alpha})` : `rgb(${value})`;
}
