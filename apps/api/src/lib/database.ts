/**
 * Database connection module
 * Reuses the shared Prisma singleton from @wallex/db.
 */

import { prisma, checkDatabaseHealth, disconnectPrisma } from '@wallex/db';
import type { PrismaClient } from '@wallex/db';

export function getPrismaClient(): PrismaClient {
  return prisma;
}

export async function connectDatabase(): Promise<void> {
  const healthy = await checkDatabaseHealth();
  if (!healthy) {
    throw new Error('Database health check failed at startup');
  }
}

export async function disconnectDatabase(): Promise<void> {
  await disconnectPrisma();
}

export default getPrismaClient;
