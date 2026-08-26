/**
 * Authentication middleware
 */

import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (error) {
    return reply.code(401).send({ success: false, error: 'Invalid or expired token' });
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await authenticate(request, reply);
  if (reply.sent) return;
  if (!isAdmin(request)) {
    return reply.code(403).send({ success: false, error: 'Admin access required' });
  }
}

export function getAuthUserId(request: FastifyRequest): string {
  const user = request.user as { userId?: string } | undefined;
  if (!user?.userId) {
    throw new Error('Authenticated user id missing');
  }
  return user.userId;
}

export function getAuthUserRole(request: FastifyRequest): string | null {
  const user = request.user as { role?: string } | undefined;
  return user?.role || null;
}

export function isAdmin(request: FastifyRequest): boolean {
  return getAuthUserRole(request) === 'ADMIN';
}
