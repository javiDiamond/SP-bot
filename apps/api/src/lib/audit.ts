/**
 * Audit logging helper
 */

import { FastifyRequest } from 'fastify';
import { Prisma } from '@wallex/db';
import getPrismaClient from './database.js';

export async function writeAuditLog(params: {
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  data?: Record<string, unknown> | string[];
  request?: FastifyRequest;
}): Promise<void> {
  const prisma = getPrismaClient();
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        ipAddress: params.request?.ip,
        userAgent: params.request?.headers['user-agent'],
        data: params.data ? (params.data as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (err) {
    // Audit logging must never break the request flow
    // eslint-disable-next-line no-console
    console.error('Failed to write audit log', err);
  }
}
