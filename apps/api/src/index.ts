/**
 * Wallex Grid Bot API Server
 * 
 * REST API for managing grid bots, viewing data, and controlling trading
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import pino from 'pino';
import { config } from './config.js';

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
  contentSecurityPolicy: false, // Configure based on your needs
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

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

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    logger.info(`Server running at http://0.0.0.0:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export default fastify;
