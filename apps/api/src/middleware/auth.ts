/**
 * Authentication middleware
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import pino from 'pino';

const logger = pino({ name: 'auth' });

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'TRADER' | 'VIEWER';
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export const authMiddleware = fp(async (fastify: any) => {
  // Register JWT
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'change-me-secret-key',
    sign: {
      expiresIn: '1d',
    },
  });

  // Decorate request with authenticate function
  fastify.decorateRequest('authenticate', async function(
    this: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      await this.jwtVerify();
      
      if (!this.user) {
        reply.code(401).send({ error: 'Unauthorized' });
        return;
      }
    } catch (error) {
      reply.code(401).send({ error: 'Invalid token' });
      return;
    }
  });
});

// Route protection decorator
export function protectRoute(handler: Function) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      return handler(request, reply);
    } catch (error) {
      logger.error(error, 'Auth error');
      return reply.code(401).send({ error: 'Invalid token' });
    }
  };
}

export default authMiddleware;
