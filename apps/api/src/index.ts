/**
 * Wallex Grid Bot API Server
 *
 * REST API for managing grid bots, viewing data, and controlling trading
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import pino from 'pino';
import { config } from './config.js';
import { connectDatabase, disconnectDatabase } from './lib/database.js';
import marketsRoutes from './routes/markets.js';
import botsRoutes from './routes/bots.js';
import authRoutes from './routes/auth.js';
import accountsRoutes from './routes/accounts.js';
import balancesRoutes from './routes/balances.js';
import ordersRoutes from './routes/orders.js';
import backtestRoutes from './routes/backtests.js';
import systemRoutes from './routes/system.js';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const fastify = Fastify({
  logger,
  trustProxy: true,
});

// Register plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});

await fastify.register(helmet, {
  contentSecurityPolicy: false,
});

await fastify.register(rateLimit, {
  max: config.rateLimitMax,
  timeWindow: config.rateLimitWindowMs,
});

await fastify.register(jwt, {
  secret: config.jwtSecret,
  sign: {
    expiresIn: '1d',
  },
});

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(marketsRoutes, { prefix: '/api/v1/markets' });
await fastify.register(botsRoutes, { prefix: '/api/v1/bots' });
await fastify.register(accountsRoutes, { prefix: '/api/accounts' });
await fastify.register(balancesRoutes, { prefix: '/api/balances' });
await fastify.register(ordersRoutes, { prefix: '/api/orders' });
await fastify.register(backtestRoutes, { prefix: '/api/backtests' });
await fastify.register(systemRoutes, { prefix: '/api/system' });

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: Date.now() };
});

// API info
fastify.get('/api', async () => {
  return {
    name: 'Wallex Grid Bot API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      markets: '/api/v1/markets',
      bots: '/api/v1/bots',
      accounts: '/api/accounts',
      balances: '/api/balances',
      orders: '/api/orders',
      backtests: '/api/backtests',
      system: '/api/system',
    },
  };
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  await disconnectDatabase();
  await fastify.close();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const start = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    await fastify.listen({ port: config.port, host: config.host });
    logger.info(`Server running at http://${config.host}:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export default fastify;
