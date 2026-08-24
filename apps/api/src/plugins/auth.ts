import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import bcrypt from 'bcrypt';
import { prisma } from '@wallex/db';
import { LoginInputSchema, RegisterInputSchema } from '@wallex/shared';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

declare module 'fastify' {
  interface User {
    id: string;
    email: string;
    role: string;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Register JWT
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'change-me-secret-key-for-development-only',
    sign: {
      expiresIn: '1h',
    },
  });

  // Decorate reply with user info
  fastify.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  // Register endpoint
  fastify.post('/register', async (request, reply) => {
    try {
      const body = RegisterInputSchema.parse(request.body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existingUser) {
        return reply.code(400).send({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          role: 'ADMIN',
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate token
      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      reply.code(201).send({
        user,
        token,
      });
    } catch (error: any) {
      fastify.log.error({ error }, 'Registration failed');
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors });
      }
      reply.code(500).send({ error: 'Registration failed' });
    }
  });

  // Login endpoint
  fastify.post('/login', async (request, reply) => {
    try {
      const body = LoginInputSchema.parse(request.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const valid = await bcrypt.compare(body.password, user.password);
      if (!valid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      reply.send({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      fastify.log.error({ error }, 'Login failed');
      if (error.name === 'ZodError') {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors });
      }
      reply.code(500).send({ error: 'Login failed' });
    }
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: request.user.id },
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        });

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        reply.send({ user });
      } catch (error: any) {
        fastify.log.error({ error }, 'Get user failed');
        reply.code(500).send({ error: 'Failed to get user' });
      }
    },
  });
};

export default fp(authPlugin, { name: 'auth' });
