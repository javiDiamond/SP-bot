/**
 * Exchange Accounts route - Manage Wallex API credentials
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import getPrismaClient from '../lib/database.js';

const accountsRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = getPrismaClient();

  const encryptionKey = process.env.ENCRYPTION_KEY || 'fallback-encryption-key-32-chars!';
  
  function encryptApiKey(apiKey: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(encryptionKey.slice(0, 32)), iv);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  function decryptApiKey(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted data format');
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(encryptionKey.slice(0, 32)), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  function maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) return '****';
    return `${apiKey.slice(0, 4)}********${apiKey.slice(-4)}`;
  }

  const createAccountSchema = z.object({
    name: z.string().min(1).max(50),
    apiKey: z.string().min(10),
    isLiveEnabled: z.boolean().default(false),
    subAccountClientId: z.string().optional(),
  });

  /**
   * GET /api/accounts
   * Get all exchange accounts
   */
  fastify.get('/', async (request, reply) => {
    try {
      const accounts = await prisma.exchangeAccount.findMany({
        select: {
          id: true,
          name: true,
          apiKeyMasked: true,
          isLiveEnabled: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: accounts,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch accounts');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch accounts',
      });
    }
  });

  /**
   * GET /api/accounts/:id
   * Get specific account details
   */
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const account = await prisma.exchangeAccount.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          apiKeyMasked: true,
          isLiveEnabled: true,
          isActive: true,
          subAccountClientId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!account) {
        return reply.code(404).send({
          success: false,
          error: 'Account not found',
        });
      }

      return {
        success: true,
        data: account,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch account');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch account',
      });
    }
  });

  /**
   * POST /api/accounts
   * Create a new exchange account
   */
  fastify.post('/', async (request, reply) => {
    try {
      const body = request.body as any;
      const validated = createAccountSchema.parse(body);

      // Encrypt API key
      const encryptedApiKey = encryptApiKey(validated.apiKey);
      const maskedApiKey = maskApiKey(validated.apiKey);

      // Check if live trading is allowed
      if (validated.isLiveEnabled && !process.env.ENABLE_LIVE_TRADING) {
        return reply.code(400).send({
          success: false,
          error: 'Live trading is disabled. Set ENABLE_LIVE_TRADING=true to enable.',
        });
      }

      const account = await prisma.exchangeAccount.create({
        data: {
          userId: 'system', // Will be replaced with auth user
          name: validated.name,
          apiKeyEncrypted: encryptedApiKey,
          apiKeyMasked: maskedApiKey,
          isLiveEnabled: validated.isLiveEnabled,
          subAccountClientId: validated.subAccountClientId,
          isActive: true,
        },
      });

      return {
        success: true,
        data: {
          ...account,
          apiKeyEncrypted: undefined, // Don't return encrypted key
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

      fastify.log.error(error, 'Failed to create account');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to create account',
      });
    }
  });

  /**
   * PUT /api/accounts/:id
   * Update an exchange account
   */
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const updateData: any = {};
      
      if (body.name) updateData.name = body.name;
      if (body.isLiveEnabled !== undefined) {
        if (body.isLiveEnabled && !process.env.ENABLE_LIVE_TRADING) {
          return reply.code(400).send({
            success: false,
            error: 'Live trading is disabled.',
          });
        }
        updateData.isLiveEnabled = body.isLiveEnabled;
      }
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.subAccountClientId !== undefined) {
        updateData.subAccountClientId = body.subAccountClientId;
      }
      
      // If new API key provided
      if (body.apiKey) {
        const encryptedApiKey = encryptApiKey(body.apiKey);
        const maskedApiKey = maskApiKey(body.apiKey);
        updateData.apiKeyEncrypted = encryptedApiKey;
        updateData.apiKeyMasked = maskedApiKey;
      }

      const account = await prisma.exchangeAccount.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        data: {
          ...account,
          apiKeyEncrypted: undefined,
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

      fastify.log.error(error, 'Failed to update account');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to update account',
      });
    }
  });

  /**
   * DELETE /api/accounts/:id
   * Delete an exchange account
   */
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      await prisma.exchangeAccount.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Account deleted',
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to delete account');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to delete account',
      });
    }
  });

  /**
   * GET /api/accounts/:id/test
   * Test exchange account connectivity
   */
  fastify.get('/:id/test', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const account = await prisma.exchangeAccount.findUnique({
        where: { id },
      });

      if (!account) {
        return reply.code(404).send({
          success: false,
          error: 'Account not found',
        });
      }

      // Decrypt API key and test connection
      const apiKey = decryptApiKey(account.apiKeyEncrypted);
      
      // TODO: Implement actual API test call
      // For now, just verify we can decrypt
      
      return {
        success: true,
        message: 'Account configuration valid',
        data: {
          canDecrypt: true,
          isLiveEnabled: account.isLiveEnabled,
          isActive: account.isActive,
        },
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to test account');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to test account',
      });
    }
  });
};

export default accountsRoutes;
