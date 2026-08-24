/**
 * Auth route - User authentication
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import argon2 from 'argon2';
import getPrismaClient from '../lib/database.js';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = getPrismaClient();

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
  });

  /**
   * POST /api/auth/register
   * Register a new user (only if no users exist or in dev mode)
   */
  fastify.post('/register', async (request, reply) => {
    try {
      const body = request.body as any;
      const validated = registerSchema.parse(body);

      // Check if this is the first user or if registration is allowed
      const userCount = await prisma.user.count();
      const isDev = process.env.NODE_ENV === 'development';
      
      if (userCount > 0 && !isDev) {
        return reply.code(403).send({
          success: false,
          error: 'Registration disabled. Contact admin.',
        });
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: validated.email },
      });

      if (existingUser) {
        return reply.code(400).send({
          success: false,
          error: 'User already exists',
        });
      }

      // Hash password
      const hashedPassword = await argon2.hash(validated.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: validated.email,
          password: hashedPassword,
          name: validated.name || 'Admin',
          role: userCount === 0 ? 'ADMIN' : 'TRADER',
        },
      });

      // Generate token
      const token = fastify.jwt.sign({ 
        userId: user.id, 
        email: user.email,
        role: user.role 
      });

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        },
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error, 'Failed to register user');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to register user',
      });
    }
  });

  /**
   * POST /api/auth/login
   * Login user
   */
  fastify.post('/login', async (request, reply) => {
    try {
      const body = request.body as any;
      const validated = loginSchema.parse(body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: validated.email },
      });

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid credentials',
        });
      }

      // Verify password
      const validPassword = await argon2.verify(user.password, validated.password);

      if (!validPassword) {
        return reply.code(401).send({
          success: false,
          error: 'Invalid credentials',
        });
      }

      // Generate token
      const token = fastify.jwt.sign({ 
        userId: user.id, 
        email: user.email,
        role: user.role 
      });

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        },
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error, 'Failed to login user');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to login',
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current user info
   */
  fastify.get('/me', async (request, reply) => {
    try {
      // Extract token from header
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({
          success: false,
          error: 'No token provided',
        });
      }

      const token = authHeader.substring(7);
      const decoded = await request.jwtVerify() as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: 'User not found',
        });
      }

      return {
        success: true,
        data: user,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to get current user');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to get user info',
      });
    }
  });
};

export default authRoutes;
