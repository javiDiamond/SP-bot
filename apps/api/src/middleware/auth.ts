/**
 * Authentication middleware
 */

import { FastifyRequest, FastifyReply } from 'fastify';

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (error) {
    throw reply.unauthorized('Invalid or expired token');
  }
}

export function getAuthUserId(request: FastifyRequest): string | null {
  const user = request.user as any;
  return user?.userId || null;
}

export function getAuthUserRole(request: FastifyRequest): string | null {
  const user = request.user as any;
  return user?.role || null;
}

export function isAdmin(request: FastifyRequest): boolean {
  const role = getAuthUserRole(request);
  return role === 'ADMIN';
}
