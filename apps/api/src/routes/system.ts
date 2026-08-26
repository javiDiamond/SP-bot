/**
 * System routes — risk settings, kill switch, event/audit logs, service status
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import Redis from 'ioredis';
import { QUEUE_NAMES, REALTIME_CHANNEL } from '@wallex/shared';
import { Queue } from 'bullmq';
import getPrismaClient from '../lib/database.js';
import { config } from '../config.js';
import { authenticate, requireAdmin, getAuthUserId } from '../middleware/auth.js';
import { enqueueBotCommand } from '../lib/queue.js';
import { writeAuditLog } from '../lib/audit.js';
import { checkDatabaseHealth } from '@wallex/db';

let publisher: Redis | null = null;
function getPublisher(): Redis {
  if (!publisher) publisher = new Redis(config.redisUrl, { lazyConnect: false });
  return publisher;
}

const updateRiskSettingsSchema = z.object({
  maxBotsGlobal: z.number().int().min(1).optional(),
  maxBotsPerSymbol: z.number().int().min(1).optional(),
  maxDailyLossPercent: z.number().min(0).max(100).optional(),
  maxQuoteExposureGlobal: z.union([z.string(), z.number()]).optional(),
  killSwitchActive: z.boolean().optional(),
  allowLiveTrading: z.boolean().optional(),
});

const killSwitchSchema = z.object({ active: z.boolean() });

const systemRoutes: FastifyPluginAsync = async fastify => {
  const prisma = getPrismaClient();

  fastify.addHook('preHandler', authenticate);

  const getRiskSettings = async () => {
    const existing = await prisma.riskSetting.findFirst({ where: { key: 'global' } });
    if (existing) return existing;
    return prisma.riskSetting.create({ data: { key: 'global' } });
  };

  /**
   * GET /api/system/status
   */
  fastify.get('/status', async (_request, reply) => {
    try {
      const db = await checkDatabaseHealth();
      let redis = false;
      try {
        const ping = await getPublisher().ping();
        redis = ping === 'PONG';
      } catch {
        redis = false;
      }

      const [runningBots, pausedBots, pendingBacktests] = await Promise.all([
        prisma.bot.count({ where: { status: 'RUNNING' } }),
        prisma.bot.count({ where: { status: 'PAUSED' } }),
        prisma.backtest.count({ where: { status: { in: ['PENDING', 'RUNNING'] } } }),
      ]);

      const risk = await getRiskSettings();

      return {
        success: true,
        data: {
          services: { database: db, redis, worker: null },
          queues: Object.values(QUEUE_NAMES),
          counts: { runningBots, pausedBots, pendingBacktests },
          riskSettings: risk,
          liveTradingEnv: config.enableLiveTrading,
        },
      };
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message || 'Status failed' });
    }
  });

  /**
   * GET /api/system/risk-settings
   */
  fastify.get('/risk-settings', async (_request, reply) => {
    try {
      return { success: true, data: await getRiskSettings() };
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message || 'Failed' });
    }
  });

  /**
   * PUT /api/system/risk-settings (admin)
   */
  fastify.put('/risk-settings', { preHandler: [requireAdmin] }, async (request, reply) => {
    try {
      const userId = getAuthUserId(request);
      const validated = updateRiskSettingsSchema.parse(request.body);

      if (validated.allowLiveTrading === true && !config.enableLiveTrading) {
        return reply.code(400).send({
          success: false,
          error: 'Cannot allow live trading: ENABLE_LIVE_TRADING=false in environment',
        });
      }

      await getRiskSettings();
      const updated = await prisma.riskSetting.update({
        where: { key: 'global' },
        data: validated,
      });

      await writeAuditLog({
        userId,
        action: 'risk.update',
        resource: 'risk_setting',
        resourceId: 'global',
        data: validated as unknown as Record<string, unknown>,
        request,
      });

      return { success: true, data: updated };
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return reply.code(400).send({ success: false, error: 'Validation error', details: error.errors });
      }
      return reply.code(500).send({ success: false, error: error.message || 'Failed' });
    }
  });

  /**
   * POST /api/system/kill-switch (admin)
   * Toggles the global kill switch; when activated, broadcasts KILL_ALL to workers.
   */
  fastify.post('/kill-switch', { preHandler: [requireAdmin] }, async (request, reply) => {
    try {
      const userId = getAuthUserId(request);
      const { active } = killSwitchSchema.parse(request.body);

      await getRiskSettings();
      const updated = await prisma.riskSetting.update({
        where: { key: 'global' },
        data: { killSwitchActive: active },
      });

      if (active) {
        // Command every running bot to stop via the worker queue
        const runningBots = await prisma.bot.findMany({
          where: { status: { in: ['RUNNING', 'STARTING', 'PAUSED'] } },
          select: { id: true },
        });
        for (const bot of runningBots) {
          await enqueueBotCommand({ type: 'KILL_ALL', botId: bot.id, actorUserId: userId, ts: Date.now() });
        }
        await prisma.bot.updateMany({
          where: { status: { in: ['RUNNING', 'STARTING', 'PAUSING'] } },
          data: { status: 'KILLED', stoppedAt: new Date() },
        });
      }

      await getPublisher().publish(
        REALTIME_CHANNEL,
        JSON.stringify({
          channel: REALTIME_CHANNEL,
          type: 'killswitch.changed',
          payload: { active },
          ts: Date.now(),
        }),
      );

      await writeAuditLog({
        userId,
        action: active ? 'killswitch.activate' : 'killswitch.deactivate',
        resource: 'risk_setting',
        resourceId: 'global',
        request,
      });

      return { success: true, data: updated };
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return reply.code(400).send({ success: false, error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error, 'Kill switch toggle failed');
      return reply.code(500).send({ success: false, error: error.message || 'Kill switch failed' });
    }
  });

  /**
   * GET /api/system/events?botId=..&level=..&limit=100
   */
  fastify.get('/events', async (request, reply) => {
    try {
      const query = request.query as { botId?: string; level?: string; limit?: string };
      const events = await prisma.eventLog.findMany({
        where: {
          ...(query.botId ? { botId: query.botId } : {}),
          ...(query.level ? { level: query.level as any } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(query.limit || 100), 500),
      });
      return { success: true, data: events };
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message || 'Failed to fetch events' });
    }
  });

  /**
   * GET /api/system/audit-logs (admin)
   */
  fastify.get('/audit-logs', { preHandler: [requireAdmin] }, async (request, reply) => {
    try {
      const query = request.query as { userId?: string; action?: string; limit?: string };
      const logs = await prisma.auditLog.findMany({
        where: {
          ...(query.userId ? { userId: query.userId } : {}),
          ...(query.action ? { action: { contains: query.action } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(query.limit || 100), 500),
        include: { user: { select: { email: true } } },
      });
      return { success: true, data: logs };
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message || 'Failed to fetch audit logs' });
    }
  });

  /**
   * GET /api/system/queue-depths
   */
  fastify.get('/queue-depths', async (_request, reply) => {
    try {
      const depths: Record<string, number> = {};
      for (const name of Object.values(QUEUE_NAMES)) {
        const queue = new Queue(name, { connection: { url: config.redisUrl } });
        const counts = await queue.getJobCounts('waiting', 'active', 'delayed', 'failed');
        depths[name] = (counts.waiting || 0) + (counts.active || 0) + (counts.delayed || 0);
        await queue.close();
      }
      return { success: true, data: depths };
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message || 'Failed' });
    }
  });
};

export default systemRoutes;
