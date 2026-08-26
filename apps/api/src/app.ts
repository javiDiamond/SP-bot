/**
 * Fastify application factory.
 *
 * Separated from index.ts so integration tests can build the app with
 * fastify.inject instead of binding a port.
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import { config } from './config.js';
import marketsRoutes from './routes/markets.js';
import botsRoutes from './routes/bots.js';
import authRoutes from './routes/auth.js';
import accountsRoutes from './routes/accounts.js';
import balancesRoutes from './routes/balances.js';
import ordersRoutes from './routes/orders.js';
import backtestRoutes from './routes/backtests.js';
import systemRoutes from './routes/system.js';
import streamRoutes from './routes/stream.js';

export interface BuildAppOptions {
  logger?: boolean | FastifyInstance['log'];
  /** Skip global rate limiting (used by the test suite). */
  disableRateLimit?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger:
      options.logger ??
      {
        level: process.env.LOG_LEVEL || 'info',
      },
    trustProxy: true,
  });

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  if (!options.disableRateLimit) {
    await fastify.register(rateLimit, {
      max: config.rateLimitMax,
      timeWindow: config.rateLimitWindowMs,
    });
  }

  await fastify.register(jwt, {
    secret: config.jwtSecret,
    sign: {
      expiresIn: '1d',
    },
  });

  // Register routes (each applies its own auth preHandler)
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(marketsRoutes, { prefix: '/api/v1/markets' });
  await fastify.register(botsRoutes, { prefix: '/api/v1/bots' });
  await fastify.register(accountsRoutes, { prefix: '/api/accounts' });
  await fastify.register(balancesRoutes, { prefix: '/api/balances' });
  await fastify.register(ordersRoutes, { prefix: '/api/orders' });
  await fastify.register(backtestRoutes, { prefix: '/api/backtests' });
  await fastify.register(systemRoutes, { prefix: '/api/system' });
  await fastify.register(streamRoutes, { prefix: '/api/stream' });

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
        stream: '/api/stream',
      },
    };
  });

  return fastify;
}

export default buildApp;
