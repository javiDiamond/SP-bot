/**
 * Worker configuration (environment-driven)
 */

import path from 'path';
import dotenv from 'dotenv';

// Load the repo-root .env (no-op when absent, e.g. in docker where env is injected)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Must match the API dev fallback so keys encrypted by the API can be
// decrypted by the worker during local development.
const DEV_FALLBACK_ENCRYPTION_KEY =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const encryptionKeyIsValid = (key: string): boolean => /^[0-9a-fA-F]{64}$/.test(key);

export const config = {
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Security
  encryptionKey: encryptionKeyIsValid(process.env.ENCRYPTION_KEY || '')
    ? (process.env.ENCRYPTION_KEY as string)
    : DEV_FALLBACK_ENCRYPTION_KEY,

  // Wallex exchange
  wallexApiBaseUrl: process.env.WALLEX_API_BASE_URL || 'https://api.wallex.ir',
  wallexWsUrl: process.env.WALLEX_WS_URL || 'wss://api.wallex.ir/ws',
  wallexApiKeyHeader: process.env.WALLEX_API_KEY_HEADER || 'API-Key',
  wallexStreamKey: process.env.WALLEX_STREAM_KEY,
  subAccountClientId: process.env.SUB_ACCOUNT_CLIENT_ID,

  // Trading gates
  enableLiveTrading: process.env.ENABLE_LIVE_TRADING === 'true',

  // Market data
  wsEnabled: process.env.WORKER_WS_ENABLED !== 'false',
  stalePriceTimeoutMs: parseInt(process.env.STALE_PRICE_TIMEOUT_SECONDS || '30', 10) * 1000,
  restPollIntervalMs: parseInt(process.env.REST_POLL_INTERVAL_MS || '5000', 10),
  minNotionalFallback: process.env.MIN_NOTIONAL_FALLBACK || '1',

  // Health endpoint (docker compose healthcheck)
  healthPort: parseInt(process.env.WORKER_HEALTH_PORT || '4001', 10),

  // Periodic jobs
  reconcileIntervalMs: parseInt(process.env.RECONCILE_INTERVAL_MINUTES || '15', 10) * 60_000,
  pnlSnapshotIntervalMs: parseInt(process.env.PNL_SNAPSHOT_INTERVAL_MINUTES || '5', 10) * 60_000,

  // Locks
  botLockTtlMs: parseInt(process.env.BOT_LOCK_TTL_SECONDS || '30', 10) * 1000,
  botLockRenewMs: parseInt(process.env.BOT_LOCK_RENEW_SECONDS || '10', 10) * 1000,
};

// Back-compat alias
export const workerConfig = config;

export default config;
