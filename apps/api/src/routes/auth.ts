/**
 * Auth routes — login / register / me (bcryptjs, schema field passwordHash)
 */

import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { LoginSchema, RegisterSchema } from '@wallex/shared';
import getPrismaClient from '../lib/database.js';
import { authenticate, getAuthUserId } from '../middleware/auth.js';
import { writeAuditLog } from '../lib/audit.js';

/** Supported UI locales for the per-user language preference. */
const SUPPORTED_LOCALES = ['en', 'fa'] as const;

const updateMeSchema = z.object({
  preferredLocale: z.enum(SUPPORTED_LOCALES).nullable(),
});

const authRoutes: FastifyPluginAsync = async fastify => {
  const prisma = getPrismaClient();

  const publicUser = (user: {
    id: string;
    email: string;
    role: string;
    preferredLocale?: string | null;
  }) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    preferredLocale: user.preferredLocale ?? null,
  });

  /**
   * POST /api/auth/register
   * First user ever (or dev mode) may register; first user becomes ADMIN.
   */
  fastify.post('/register', async (request, reply) => {
    try {
      const validated = RegisterSchema.parse(request.body);

      const userCount = await prisma.user.count();
      const isDev = process.env.NODE_ENV === 'development';

      if (userCount > 0 && !isDev) {
        return reply.code(403).send({
          success: false,
          error: 'Registration disabled. Contact admin.',
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: validated.email },
      });

      if (existingUser) {
        return reply.code(400).send({
          success: false,
          error: 'User already exists',
        });
      }

      const passwordHash = await bcrypt.hash(validated.password, 10);

      const user = await prisma.user.create({
        data: {
          email: validated.email,
          passwordHash,
          role: userCount === 0 ? 'ADMIN' : 'TRADER',
        },
      });

      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        success: true,
        data: { user: publicUser(user), token },
      };
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      fastify.log.error(error, 'Failed to register user');
      return reply.code(500).send({
        success: false,
        error: 'Failed to register user',
      });
    }
  });

  /**
   * POST /api/auth/login
   */
  fastify.post('/login', async (request, reply) => {
    try {
      const validated = LoginSchema.parse(request.body);

      const user = await prisma.user.findUnique({
        where: { email: validated.email },
      });

      if (!user) {
        return reply.code(401).send({ success: false, error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(validated.password, user.passwordHash);
      if (!validPassword) {
        return reply.code(401).send({ success: false, error: 'Invalid credentials' });
      }

      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      await writeAuditLog({
        userId: user.id,
        action: 'auth.login',
        resource: 'user',
        resourceId: user.id,
        request,
      });

      return {
        success: true,
        data: { user: publicUser(user), token },
      };
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      fastify.log.error(error, 'Failed to login');
      return reply.code(500).send({ success: false, error: 'Failed to login' });
    }
  });

  /**
   * GET /api/auth/me
   */
  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const userId = getAuthUserId(request);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, preferredLocale: true, createdAt: true },
      });

      if (!user) {
        return reply.code(404).send({ success: false, error: 'User not found' });
      }

      return { success: true, data: user };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to get current user');
      return reply.code(500).send({ success: false, error: 'Failed to get user info' });
    }
  });

  /**
   * PATCH /api/auth/me
   * Update mutable profile fields of the current user.
   * Currently supports: preferredLocale ('en' | 'fa' | null).
   */
  fastify.patch('/me', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const userId = getAuthUserId(request);
      const validated = updateMeSchema.parse(request.body);

      const user = await prisma.user.update({
        where: { id: userId },
        data: { preferredLocale: validated.preferredLocale },
        select: { id: true, email: true, role: true, preferredLocale: true },
      });

      await writeAuditLog({
        userId,
        action: 'user.update',
        resource: 'user',
        resourceId: userId,
        data: { preferredLocale: validated.preferredLocale },
        request,
      });

      return { success: true, data: user };
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      fastify.log.error(error, 'Failed to update current user');
      return reply.code(500).send({ success: false, error: 'Failed to update user' });
    }
  });
};

export default authRoutes;
