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
await fastify.register(marketsRoutes, { prefix: '/api/v1/markets' });
await fastify.register(botsRoutes, { prefix: '/api/v1/bots' });

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
      markets: '/api/v1/markets',
      bots: '/api/v1/bots',
      backtests: '/api/v1/backtests',
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
