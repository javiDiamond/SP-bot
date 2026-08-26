/**
 * API Configuration
 */

import path from 'path';
import dotenv from 'dotenv';

// Load the repo-root .env (no-op when absent, e.g. in docker where env is injected)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Development-only fallbacks. All processes (api/worker/seed) share the same
// dev keys so data encrypted by one can be decrypted by the others.
export const DEV_FALLBACK_JWT_SECRET = 'dev-only-jwt-secret-change-in-production-32ch';
export const DEV_FALLBACK_ENCRYPTION_KEY =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

export const isProduction = process.env.NODE_ENV === 'production';

const INSECURE_JWT_SECRETS = new Set([
  'change-me',
  'change-me-to-secure-random-string',
  'change-me-to-secure-random-string-at-least-32-chars',
  'fallback-secret-change-in-production',
  DEV_FALLBACK_JWT_SECRET,
]);

/** Fail fast in production when secrets are missing or placeholder values. */
export function assertProductionSecrets(): void {
  if (!isProduction) return;

  const problems: string[] = [];

  const jwt = process.env.JWT_SECRET;
  if (!jwt || jwt.length < 32 || INSECURE_JWT_SECRETS.has(jwt)) {
    problems.push('JWT_SECRET must be set to a strong secret (32+ chars) in production');
  }

  const enc = process.env.ENCRYPTION_KEY;
  if (!/^[0-9a-fA-F]{64}$/.test(enc || '')) {
    problems.push('ENCRYPTION_KEY must be set to 64 hex chars (openssl rand -hex 32) in production');
  }

  if ((process.env.ADMIN_PASSWORD || 'change-me') === 'change-me') {
    problems.push('ADMIN_PASSWORD must be changed from "change-me" in production');
  }

  if (problems.length > 0) {
    throw new Error(`Insecure production configuration:\n- ${problems.join('\n- ')}`);
  }
}

export const encryptionKeyIsValid = (key: string): boolean => /^[0-9a-fA-F]{64}$/.test(key);

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/wallex_grid_bot',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Security
  jwtSecret: process.env.JWT_SECRET || DEV_FALLBACK_JWT_SECRET,
  encryptionKey: encryptionKeyIsValid(process.env.ENCRYPTION_KEY || '')
    ? (process.env.ENCRYPTION_KEY as string)
    : DEV_FALLBACK_ENCRYPTION_KEY,
  
  // Wallex Exchange
  wallexApiBaseUrl: process.env.WALLEX_API_BASE_URL || 'https://api.wallex.ir',
  wallexWsUrl: process.env.WALLEX_WS_URL || 'wss://api.wallex.ir/ws',
  wallexApiKeyHeader: process.env.WALLEX_API_KEY_HEADER || 'API-Key',
  
  // Trading
  enableLiveTrading: process.env.ENABLE_LIVE_TRADING === 'true',
  defaultTradingMode: process.env.DEFAULT_TRADING_MODE || 'DRY_RUN',
  
  // Risk Controls
  stalePriceTimeoutSeconds: parseInt(process.env.STALE_PRICE_TIMEOUT_SECONDS || '30', 10),
  restPollIntervalMs: parseInt(process.env.REST_POLL_INTERVAL_MS || '5000', 10),
  orderRateLimitPer10s: parseInt(process.env.ORDER_RATE_LIMIT_PER_10S || '20', 10),
  
  // Rate Limiting
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  
  // Admin
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'change-me',
};

export default config;
