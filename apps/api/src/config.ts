/**
 * Application Configuration
 */

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.API_PORT || '3001', 10),
  host: process.env.API_HOST || '0.0.0.0',
  
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Live trading gates
  enableLiveTrading: process.env.ENABLE_LIVE_TRADING === 'true',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://wallex:wallex@localhost:5432/wallex_grid',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Wallex API
  wallexBaseUrl: process.env.WALLEX_BASE_URL || 'https://api.wallex.ir',
  wallexApiKeyHeader: process.env.WALLEX_API_KEY_HEADER || 'API-Key',
  
  // Security
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  
  // Rate limiting
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
};

// Validate required configuration in production
if (config.isProduction) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-me-in-production') {
    throw new Error('JWT_SECRET must be set in production');
  }
}

export default config;
