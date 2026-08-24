/**
 * Database connection module
 */

import { PrismaClient } from '@wallex/db';

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  return prisma;
}

export async function connectDatabase(): Promise<void> {
  const client = getPrismaClient();
  await client.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

export default getPrismaClient;
