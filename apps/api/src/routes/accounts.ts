/**
 * Exchange accounts routes — encrypted API key storage
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { encryptApiKey, decryptApiKey, maskApiKey } from '@wallex/shared';
import getPrismaClient from '../lib/database.js';
import { config } from '../config.js';
import { authenticate, getAuthUserId } from '../middleware/auth.js';
import { writeAuditLog } from '../lib/audit.js';

const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  apiKey: z.string().min(1),
  subAccountClientId: z.string().optional(),
  isLiveEnabled: z.boolean().optional(),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  apiKey: z.string().min(1).optional(),
  subAccountClientId: z.string().optional().nullable(),
  isLiveEnabled: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

function maskStoredKey(account: {
  apiKeyEncrypted: string;
  apiIv: string;
  apiAuthTag: string;
}): string {
  try {
    const raw = decryptApiKey(
      account.apiKeyEncrypted,
      account.apiIv,
      account.apiAuthTag,
      config.encryptionKey,
    );
    return maskApiKey(raw);
  } catch {
    return '********';
  }
}

const accountsRoutes: FastifyPluginAsync = async fastify => {
  const prisma = getPrismaClient();

  fastify.addHook('preHandler', authenticate);

  const sanitize = (account: any) => ({
    id: account.id,
    userId: account.userId,
    name: account.name,
    apiKeyMasked: maskStoredKey(account),
    subAccountClientId: account.subAccountClientId,
    isLiveEnabled: account.isLiveEnabled,
    isActive: account.isActive,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  });

  /**
   * GET /api/accounts
   */
  fastify.get('/', async (request, reply) => {
    try {
      const userId = getAuthUserId(request);
      const accounts = await prisma.exchangeAccount.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: accounts.map(sanitize) };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch accounts');
      return reply.code(500).send({ success: false, error: error.message || 'Failed to fetch accounts' });
    }
  });

  /**
   * POST /api/accounts
   */
  fastify.post('/', async (request, reply) => {
    try {
      const userId = getAuthUserId(request);
      const validated = createAccountSchema.parse(request.body);

      const { encrypted, iv, authTag } = encryptApiKey(validated.apiKey, config.encryptionKey);

      const account = await prisma.exchangeAccount.create({
        data: {
          userId,
          name: validated.name,
          apiKeyEncrypted: encrypted,
          apiIv: iv,
          apiAuthTag: authTag,
          subAccountClientId: validated.subAccountClientId,
          isLiveEnabled: validated.isLiveEnabled ?? false,
          isActive: true,
        },
      });

      await writeAuditLog({
        userId,
        action: 'account.create',
        resource: 'exchange_account',
        resourceId: account.id,
        data: { name: account.name, apiKeyMasked: maskApiKey(validated.apiKey) },
        request,
      });

      return { success: true, data: sanitize(account) };
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return reply.code(400).send({ success: false, error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error, 'Failed to create account');
      return reply.code(500).send({ success: false, error: error.message || 'Failed to create account' });
    }
  });

  /**
   * PATCH /api/accounts/:id
   */
  fastify.patch('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = getAuthUserId(request);
      const validated = updateAccountSchema.parse(request.body);

      const existing = await prisma.exchangeAccount.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) {
        return reply.code(404).send({ success: false, error: 'Account not found' });
      }

      // Enabling live trading requires admin + global risk flag
      if (validated.isLiveEnabled === true) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.role !== 'ADMIN') {
          return reply.code(403).send({ success: false, error: 'Admin required to enable live trading' });
        }
        const risk = await prisma.riskSetting.findFirst({ where: { key: 'global' } });
        if (!config.enableLiveTrading || !risk?.allowLiveTrading) {
          return reply.code(400).send({
            success: false,
            error: 'Live trading is globally disabled (env + risk settings)',
          });
        }
      }

      const updateData: Record<string, unknown> = {};
      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.subAccountClientId !== undefined) updateData.subAccountClientId = validated.subAccountClientId;
      if (validated.isLiveEnabled !== undefined) updateData.isLiveEnabled = validated.isLiveEnabled;
      if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
      if (validated.apiKey) {
        const { encrypted, iv, authTag } = encryptApiKey(validated.apiKey, config.encryptionKey);
        updateData.apiKeyEncrypted = encrypted;
        updateData.apiIv = iv;
        updateData.apiAuthTag = authTag;
      }

      const account = await prisma.exchangeAccount.update({ where: { id }, data: updateData });

      await writeAuditLog({
        userId,
        action: 'account.update',
        resource: 'exchange_account',
        resourceId: id,
        data: { fields: Object.keys(updateData) },
        request,
      });

      return { success: true, data: sanitize(account) };
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return reply.code(400).send({ success: false, error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error, 'Failed to update account');
      return reply.code(500).send({ success: false, error: error.message || 'Failed to update account' });
    }
  });

  /**
   * DELETE /api/accounts/:id
   */
  fastify.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = getAuthUserId(request);

      const existing = await prisma.exchangeAccount.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) {
        return reply.code(404).send({ success: false, error: 'Account not found' });
      }

      const activeBots = await prisma.bot.count({
        where: { exchangeAccountId: id, status: { in: ['RUNNING', 'STARTING', 'PAUSED'] } },
      });
      if (activeBots > 0) {
        return reply.code(409).send({ success: false, error: 'Account has active bots; stop them first' });
      }

      await prisma.exchangeAccount.delete({ where: { id } });

      await writeAuditLog({
        userId,
        action: 'account.delete',
        resource: 'exchange_account',
        resourceId: id,
        request,
      });

      return { success: true, message: 'Account deleted' };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to delete account');
      return reply.code(500).send({ success: false, error: error.message || 'Failed to delete account' });
    }
  });
};

export default accountsRoutes;
