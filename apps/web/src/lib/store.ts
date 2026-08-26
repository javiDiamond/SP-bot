'use client';

import { create } from 'zustand';
import { api, setToken } from './api';
import type { UserRow } from './types';

interface AuthState {
  user: UserRow | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
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
    set({ user: { id: data.user.id, email: data.user.email, role: data.user.role as UserRow['role'] } });
  },

  logout: () => {
    setToken(null);
    set({ user: null });
    if (typeof window !== 'undefined') window.location.href = '/login';
  },

  hydrate: async () => {
    try {
      const res = await api.me();
      set({ user: res.data as UserRow, hydrated: true });
    } catch {
      setToken(null);
      set({ user: null, hydrated: true });
    }
  },
}));
