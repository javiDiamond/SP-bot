/**
 * Bots routes — grid bot CRUD + lifecycle control via worker queue
 */

import { FastifyPluginAsync } from 'fastify';
import { CreateBotSchema, UpdateBotSchema } from '@wallex/shared';
import { BotStatus } from '@wallex/db';
import getPrismaClient from '../lib/database.js';
import { config } from '../config.js';
import { authenticate, getAuthUserId } from '../middleware/auth.js';
import { enqueueBotCommand } from '../lib/queue.js';
import { writeAuditLog } from '../lib/audit.js';

const botsRoutes: FastifyPluginAsync = async fastify => {
  const prisma = getPrismaClient();

  fastify.addHook('preHandler', authenticate);

  const loadOwnedBot = async (id: string, userId: string, isAdmin: boolean) => {
    const bot = await prisma.bot.findUnique({ where: { id } });
    if (!bot) return null;
    if (!isAdmin && bot.userId !== userId) return null;
    return bot;
  };

  /**
   * GET /api/v1/bots
   */
  fastify.get('/', async (request, reply) => {
    try {
      const userId = getAuthUserId(request);
      const bots = await prisma.bot.findMany({
        where: { userId },
        include: {
          gridLevels: { orderBy: { levelIndex: 'asc' } },
          orders: { take: 10, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: bots };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch bots');
      return reply.code(500).send({ success: false, error: error.message || 'Failed to fetch bots' });
    }
  });

  /**
   * GET /api/v1/bots/:id
   */
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = getAuthUserId(request);
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const owned = await loadOwnedBot(id, userId, user?.role === 'ADMIN');
      if (!owned) {
        return reply.code(404).send({ success: false, error: 'Bot not found' });
      }

      const bot = await prisma.bot.findUnique({
        where: { id },
        include: {
          gridLevels: { orderBy: { levelIndex: 'asc' } },
          orders: { orderBy: { createdAt: 'desc' }, take: 200 },
          fills: { orderBy: { timestamp: 'desc' }, take: 200 },
          pnlSnapshots: { orderBy: { timestamp: 'desc' }, take: 500 },
        },
      });

      if (!bot) {
        return reply.code(404).send({ success: false, error: 'Bot not found' });
      }

      return { success: true, data: bot };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch bot');
      return reply.code(500).send({ success: false, error: error.message || 'Failed to fetch bot' });
    }
  });

  /**
   * POST /api/v1/bots
   */
  fastify.post('/', async (request, reply) => {
    try {
      const userId = getAuthUserId(request);
      const validated = CreateBotSchema.parse(request.body);

      // Live gate: env + DB risk settings + account flag
      if (validated.mode === 'LIVE') {
        if (!config.enableLiveTrading) {
          return reply.code(400).send({
            success: false,
            error: 'Live trading disabled: ENABLE_LIVE_TRADING=false',
          });
        }
        const risk = await prisma.riskSetting.findFirst({ where: { key: 'global' } });
        if (!risk?.allowLiveTrading) {
          return reply.code(400).send({
            success: false,
            error: 'Live trading disabled in risk settings',
          });
        }
        if (!validated.exchangeAccountId) {
          return reply.code(400).send({
            success: false,
            error: 'Live bots require an exchange account',
          });
        }
        const account = await prisma.exchangeAccount.findUnique({
          where: { id: validated.exchangeAccountId },
        });
        if (!account?.isLiveEnabled) {
          return reply.code(400).send({
            success: false,
            error: 'Exchange account is not live-enabled',
          });
        }
      }

      // Price range sanity
      const lower = parseFloat(validated.gridConfig.lowerPrice);
      const upper = parseFloat(validated.gridConfig.upperPrice);
      if (!(lower > 0) || !(upper > 0) || lower >= upper) {
        return reply.code(400).send({
          success: false,
          error: 'lowerPrice must be positive and less than upperPrice',
        });
      }

      // Percent values are stored as-is (e.g. 5 = 5%); the risk service
      // converts to a fraction when evaluating limits.
      const bot = await prisma.bot.create({
        data: {
          userId,
          exchangeAccountId: validated.exchangeAccountId,
          name: validated.name,
          symbol: validated.symbol.toUpperCase(),
          strategyType: 'GRID',
          mode: validated.mode,
          status: BotStatus.DRAFT,
          gridConfig: validated.gridConfig as object,
          maxQuoteExposure: validated.maxQuoteExposure,
          maxBaseExposure: validated.maxBaseExposure,
          dailyLossLimitPercent: validated.dailyLossLimitPercent ?? validated.gridConfig.dailyLossLimitPercent,
        },
      });

      await writeAuditLog({
        userId,
        action: 'bot.create',
        resource: 'bot',
        resourceId: bot.id,
        data: { name: bot.name, symbol: bot.symbol, mode: bot.mode },
        request,
      });

      return { success: true, data: bot };
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return reply.code(400).send({ success: false, error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error, 'Failed to create bot');
      return reply.code(500).send({ success: false, error: error.message || 'Failed to create bot' });
    }
  });

  /**
   * PATCH /api/v1/bots/:id
   */
  fastify.patch('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = getAuthUserId(request);
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const bot = await loadOwnedBot(id, userId, user?.role === 'ADMIN');
      if (!bot) return reply.code(404).send({ success: false, error: 'Bot not found' });
      if (bot.status !== BotStatus.DRAFT && bot.status !== BotStatus.STOPPED && bot.status !== BotStatus.ERROR) {
        return reply.code(409).send({ success: false, error: 'Stop the bot before editing' });
      }

      const validated = UpdateBotSchema.parse(request.body);
      const updated = await prisma.bot.update({
        where: { id },
        data: {
          name: validated.name,
          gridConfig: validated.gridConfig ? (validated.gridConfig as object) : undefined,
          maxQuoteExposure: validated.maxQuoteExposure,
          maxBaseExposure: validated.maxBaseExposure,
          dailyLossLimitPercent: validated.dailyLossLimitPercent,
        },
      });

      return { success: true, data: updated };
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return reply.code(400).send({ success: false, error: 'Validation error', details: error.errors });
      }
      return reply.code(500).send({ success: false, error: error.message || 'Failed to update bot' });
    }
  });

  // ==========================================================================
  // Lifecycle control — sets transitional DB status and enqueues worker command
  // ==========================================================================

  type CommandRoute = {
    path: string;
    command: 'START' | 'PAUSE' | 'RESUME' | 'STOP' | 'CANCEL_ALL';
    transitional?: BotStatus;
    allowedFrom: BotStatus[];
    audit: string;
  };

  const commandRoutes: CommandRoute[] = [
    {
      path: '/:id/start',
      command: 'START',
      transitional: BotStatus.STARTING,
      allowedFrom: [BotStatus.DRAFT, BotStatus.STOPPED, BotStatus.ERROR, BotStatus.RANGE_EXITED],
      audit: 'bot.start',
    },
    {
      path: '/:id/pause',
      command: 'PAUSE',
      transitional: BotStatus.PAUSING,
      allowedFrom: [BotStatus.RUNNING, BotStatus.STARTING],
      audit: 'bot.pause',
    },
    {
      path: '/:id/resume',
      command: 'RESUME',
      transitional: BotStatus.STARTING,
      allowedFrom: [BotStatus.PAUSED, BotStatus.PAUSING],
      audit: 'bot.resume',
    },
    {
      path: '/:id/stop',
      command: 'STOP',
      transitional: BotStatus.STOPPING,
      allowedFrom: [
        BotStatus.RUNNING,
        BotStatus.STARTING,
        BotStatus.PAUSED,
        BotStatus.PAUSING,
        BotStatus.ERROR,
        BotStatus.RANGE_EXITED,
      ],
      audit: 'bot.stop',
    },
    {
      path: '/:id/cancel-all',
      command: 'CANCEL_ALL',
      allowedFrom: [BotStatus.RUNNING, BotStatus.PAUSED, BotStatus.STARTING, BotStatus.PAUSING, BotStatus.ERROR],
      audit: 'bot.cancel_all',
    },
  ];

  for (const route of commandRoutes) {
    fastify.post(route.path, async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = getAuthUserId(request);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const bot = await loadOwnedBot(id, userId, user?.role === 'ADMIN');
        if (!bot) return reply.code(404).send({ success: false, error: 'Bot not found' });

        if (!route.allowedFrom.includes(bot.status)) {
          return reply.code(409).send({
            success: false,
            error: `Cannot ${route.command.toLowerCase()} bot in status ${bot.status}`,
          });
        }

        await enqueueBotCommand({
          type: route.command,
          botId: id,
          actorUserId: userId,
          ts: Date.now(),
        });

        const updated = await prisma.bot.update({
          where: { id },
          data: {
            ...(route.transitional ? { status: route.transitional } : {}),
            ...(route.command === 'START' ? { startedAt: new Date() } : {}),
            ...(route.command === 'STOP' ? { stoppedAt: new Date() } : {}),
          },
        });

        await writeAuditLog({
          userId,
          action: route.audit,
          resource: 'bot',
          resourceId: id,
          request,
        });

        return { success: true, data: updated };
      } catch (error: any) {
        fastify.log.error(error, `Failed bot command ${route.command}`);
        return reply.code(500).send({ success: false, error: error.message || 'Command failed' });
      }
    });
  }

  /**
   * DELETE /api/v1/bots/:id
   */
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = getAuthUserId(request);
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const bot = await loadOwnedBot(id, userId, user?.role === 'ADMIN');
      if (!bot) return reply.code(404).send({ success: false, error: 'Bot not found' });

      const deletableStatuses: BotStatus[] = [
        BotStatus.DRAFT,
        BotStatus.STOPPED,
        BotStatus.ERROR,
        BotStatus.RANGE_EXITED,
      ];
      if (!deletableStatuses.includes(bot.status)) {
        return reply.code(409).send({ success: false, error: 'Stop the bot before deleting' });
      }

      await prisma.bot.delete({ where: { id } });

      await writeAuditLog({
        userId,
        action: 'bot.delete',
        resource: 'bot',
        resourceId: id,
        data: { name: bot.name },
        request,
      });

      return { success: true, message: 'Bot deleted' };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to delete bot');
      return reply.code(500).send({ success: false, error: error.message || 'Failed to delete bot' });
    }
  });
};

export default botsRoutes;
