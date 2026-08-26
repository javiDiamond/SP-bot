/**
 * Resolve the API base URL at runtime so the dashboard works behind
 * Codespaces / tunnel port forwarding, where the browser origin of the
 * dashboard and the API are on different forwarded hostnames.
 *
 * Precedence:
 * 1. NEXT_PUBLIC_API_URL / API_URL when explicitly set at build time
 * 2. Browser: GitHub Codespaces forwarded host (<id>-3000.app.github.dev ->
 *    swap the port segment to 4000)
 * 3. Browser: localhost dev (any port -> :4000)
 * 4. Browser: same origin (reverse-proxy setups)
 * 5. SSR / fallback: http://localhost:4000
 */
function resolveApiBaseUrl(): string {
  const env =
    (typeof process !== 'undefined' &&
      ((process as any).env?.NEXT_PUBLIC_API_URL || (process as any).env?.API_URL)) ||
    '';
  if (env) return env;

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;

    const codespaces = hostname.match(/^(.*-)(\d+)\.app\.github\.dev$/);
    if (codespaces) {
      return `https://${codespaces[1]}4000.app.github.dev`;
    }

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:4000`;
    }

    if (protocol && hostname) {
      return port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
    }
  }

  return 'http://localhost:4000';
}

export const API_URL: string = resolveApiBaseUrl();

const TOKEN_KEY = '***';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  pagination?: { page: number; perPage: number; total: number };
  source?: string;
  degraded?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    auth?: boolean;
  } = {},
): Promise<ApiEnvelope<T>> {
  const { method = 'GET', body, query, auth = true } = options;

  const url = new URL(path, API_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (res.status === 401 && auth) {
    setToken(null);
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Session expired');
  }

  const text = await res.text();
  let json: ApiEnvelope<T> | undefined;
  try {
    json = JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(res.status, `Bad response (${res.status})`);
  }

  if (!res.ok || json?.success === false) {
    throw new ApiError(res.status, json?.error || `Request failed (${res.status})`, json?.details);
  }

  return json;
}

export const api = {
  // auth
  login: (email: string, password: string) =>
    apiFetch<{ user: { id: string; email: string; role: string }; token: string }>(
      '/api/auth/login',
      { method: 'POST', body: { email, password }, auth: false },
    ),
  me: () => apiFetch<{ id: string; email: string; role: string }>('/api/auth/me'),

  // markets
  markets: (refresh?: boolean) =>
    apiFetch<any[]>('/api/v1/markets', { query: refresh ? { refresh: 'true' } : undefined }),
  ticker: (symbol: string) =>
    apiFetch<{ symbol: string; lastPrice?: string; bestBid?: string; bestAsk?: string }>(
      `/api/v1/markets/${encodeURIComponent(symbol)}/ticker`,
    ),
  candles: (symbol: string, query?: { resolution?: string; from?: number; to?: number; limit?: number }) =>
    apiFetch<any[]>(`/api/v1/markets/${encodeURIComponent(symbol)}/candles`, { query }),
  ingestCandles: (symbol: string, body: { resolution: string; from: number; to: number }) =>
    apiFetch(`/api/v1/markets/${encodeURIComponent(symbol)}/candles`, { method: 'POST', body }),

  // bots
  bots: () => apiFetch<any[]>('/api/v1/bots'),
  bot: (id: string) => apiFetch<any>(`/api/v1/bots/${id}`),
  createBot: (body: unknown) => apiFetch<any>('/api/v1/bots', { method: 'POST', body }),
  updateBot: (id: string, body: unknown) =>
    apiFetch<any>(`/api/v1/bots/${id}`, { method: 'PATCH', body }),
  deleteBot: (id: string) => apiFetch(`/api/v1/bots/${id}`, { method: 'DELETE' }),
  botCommand: (id: string, command: 'start' | 'pause' | 'resume' | 'stop' | 'cancel-all') =>
    apiFetch<any>(`/api/v1/bots/${id}/${command}`, { method: 'POST' }),

  // backtests
  backtests: () => apiFetch<any[]>('/api/backtests'),
  backtest: (id: string) => apiFetch<any>(`/api/backtests/${id}`),
  createBacktest: (body: unknown) => apiFetch<any>('/api/backtests', { method: 'POST', body }),
  compareBacktests: (ids: string[]) =>
    apiFetch<any[]>('/api/backtests/compare', { method: 'POST', body: { ids } }),
  createOptimization: (body: unknown) =>
    apiFetch<any>('/api/backtests/optimizations', { method: 'POST', body }),
  optimization: (id: string) => apiFetch<any>(`/api/backtests/optimizations/${id}`),

  // orders & fills
  orders: (query?: Record<string, string | number | boolean | undefined>) =>
    apiFetch<any[]>('/api/orders', { query }),
  fills: (query?: Record<string, string | number | boolean | undefined>) =>
    apiFillFills(query),

  // balances
  balances: () => apiFetch<any[]>('/api/balances/current'),
  balanceHistory: (query?: Record<string, string | number | boolean | undefined>) =>
    apiFetch<any[]>('/api/balances/history', { query }),

  // accounts
  accounts: () => apiFetch<any[]>('/api/accounts'),
  createAccount: (body: { name: string; apiKey: string; subAccountClientId?: string }) =>
    apiFetch<any>('/api/accounts', { method: 'POST', body }),
  updateAccount: (id: string, body: Record<string, unknown>) =>
    apiFetch<any>(`/api/accounts/${id}`, { method: 'PATCH', body }),
  deleteAccount: (id: string) => apiFetch(`/api/accounts/${id}`, { method: 'DELETE' }),

  // system
  systemStatus: () => apiFetch<any>('/api/system/status'),
  riskSettings: () => apiFetch<any>('/api/system/risk-settings'),
  updateRiskSettings: (body: Record<string, unknown>) =>
    apiFetch<any>('/api/system/risk-settings', { method: 'PUT', body }),
  killSwitch: (active: boolean) =>
    apiFetch<any>('/api/system/kill-switch', { method: 'POST', body: { active } }),
  events: (query?: { botId?: string; level?: string; limit?: number }) =>
    apiFetch<any[]>('/api/system/events', { query }),
  auditLogs: (query?: { action?: string; limit?: number }) =>
    apiFetch<any[]>('/api/system/audit-logs', { query }),
  queueDepths: () => apiFetch<Record<string, number>>('/api/system/queue-depths'),
};

function apiFillFills(query?: Record<string, string | number | boolean | undefined>) {
  return apiFetch<any[]>('/api/orders/fills', { query });
}

export const csvUrl = (path: string, query?: Record<string, string | undefined>) => {
  const url = new URL(path, API_URL);
  if (query) for (const [k, v] of Object.entries(query)) if (v) url.searchParams.set(k, v);
  return url.toString();
};

export async function downloadWithAuth(path: string, filename: string, query?: Record<string, string | undefined>) {
  const token = getToken();
  const res = await fetch(csvUrl(path, query), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new ApiError(res.status, 'Download failed');
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
