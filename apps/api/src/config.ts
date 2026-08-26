/**
 * API Configuration
 */

import path from 'path';
import dotenv from 'dotenv';

// Load the repo-root .env (no-op when absent, e.g. in docker where env is injected)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/wallex_grid_bot',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Security
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  encryptionKey: process.env.ENCRYPTION_KEY || 'fallback-encryption-key-32-chars!',
  
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
