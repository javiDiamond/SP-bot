'use client';

import { create } from 'zustand';
import { api, setToken } from './api';
import { localePath, setLocaleCookie } from './locale';
import { isLocale, type AppLocale } from '@/i18n/routing';
import type { UserRow } from './types';

interface AuthState {
  user: UserRow | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<{ preferredLocale: AppLocale | null }>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,

  login: async (email, password) => {
    const res = await api.login(email, password);
    const data = res.data!;
    setToken(data.token);
    set({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role as UserRow['role'],
        preferredLocale: isLocale(data.user.preferredLocale) ? data.user.preferredLocale : null,
      },
    });
    // If the user has a stored language preference, sync the locale cookie so
    // the middleware keeps the session on that locale after redirect.
    const preferred = isLocale(data.user.preferredLocale) ? data.user.preferredLocale : null;
    if (preferred) setLocaleCookie(preferred);
    return { preferredLocale: preferred };
  },

  logout: () => {
    setToken(null);
    set({ user: null });
    if (typeof window !== 'undefined') window.location.href = localePath('/login');
  },

  hydrate: async () => {
    try {
      const res = await api.me();
      const data = res.data;
      set({
        user: {
          id: data!.id,
          email: data!.email,
          role: data!.role as UserRow['role'],
          preferredLocale: isLocale(data?.preferredLocale) ? data?.preferredLocale : null,
        },
        hydrated: true,
      });
    } catch {
      setToken(null);
      set({ user: null, hydrated: true });
    }
  },
}));
