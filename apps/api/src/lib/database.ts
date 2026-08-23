/**
 * Database client singleton
 */

import { PrismaClient } from '@prisma/client';
import pino from 'pino';

const logger = pino({ name: 'db' });

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });

    prisma.$on('query', (e) => {
      logger.debug({ query: e.query, params: e.params, duration: e.duration }, 'DB Query');
    });

    prisma.$on('error', (e) => {
      logger.error({ error: e.message, target: e.target }, 'DB Error');
    });
  }

  return prisma;
}

export async function connectDatabase(): Promise<void> {
  const db = getPrismaClient();
  try {
    await db.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error(error, 'Failed to connect to database');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    logger.info('Database disconnected');
  }
}

export default getPrismaClient;
