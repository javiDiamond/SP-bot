/**
 * System route - System status, kill switch, logs
 */

import { FastifyPluginAsync } from 'fastify';
import getPrismaClient from '../lib/database.js';

const systemRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = getPrismaClient();

  /**
   * GET /api/system/status
   * Get system status
   */
  fastify.get('/status', async (request, reply) => {
    try {
      const isLiveTradingEnabled = process.env.ENABLE_LIVE_TRADING === 'true';
      const nodeEnv = process.env.NODE_ENV || 'development';
      
      // Count bots by status
      const botCounts = await prisma.bot.groupBy({
        by: ['status'],
        _count: true,
      });

      const statusMap: any = {};
      botCounts.forEach(b => {
        statusMap[b.status] = b._count;
      });

      return {
        success: true,
        data: {
          status: 'healthy',
          nodeEnv,
          isLiveTradingEnabled,
          defaultTradingMode: process.env.DEFAULT_TRADING_MODE || 'DRY_RUN',
          bots: statusMap,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to get system status');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to get system status',
      });
    }
  });

  /**
   * GET /api/system/killswitch
   * Get kill switch status
   */
  fastify.get('/killswitch', async (request, reply) => {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'KILL_SWITCH' },
      });

      const isActive = setting?.value === 'true';

      return {
        success: true,
        data: {
          isActive,
          triggeredAt: setting?.updatedAt,
        },
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to get kill switch status');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to get kill switch status',
      });
    }
  });

  /**
   * POST /api/system/killswitch
   * Toggle kill switch
   */
  fastify.post('/killswitch', async (request, reply) => {
    try {
      const { active } = request.body as { active: boolean };

      await prisma.systemSetting.upsert({
        where: { key: 'KILL_SWITCH' },
        update: { 
          value: active.toString(),
          updatedAt: new Date(),
        },
        create: {
          key: 'KILL_SWITCH',
          value: active.toString(),
        },
      });

      fastify.log.warn({ active }, 'Kill switch toggled');

      // In production, this would send a command to all workers to stop

      return {
        success: true,
        data: { isActive: active },
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to toggle kill switch');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to toggle kill switch',
      });
    }
  });

  /**
   * GET /api/system/logs
   * Get event logs
   */
  fastify.get('/logs', async (request, reply) => {
    try {
      const { 
        level, 
        botId, 
        limit = '100',
        offset = '0' 
      } = request.query as any;

      const where: any = {};
      
      if (level) where.level = level;
      if (botId) where.botId = botId;

      const logs = await prisma.eventLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      });

      const total = await prisma.eventLog.count({ where });

      return {
        success: true,
        data: logs,
        pagination: {
          total,
          limit: parseInt(limit, 10),
          offset: parseInt(offset, 10),
        },
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch logs');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch logs',
      });
    }
  });

  /**
   * GET /api/system/audit
   * Get audit logs
   */
  fastify.get('/audit', async (request, reply) => {
    try {
      const { 
        action, 
        userId,
        limit = '100',
        offset = '0' 
      } = request.query as any;

      const where: any = {};
      
      if (action) where.action = action;
      if (userId) where.userId = userId;

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      });

      const total = await prisma.auditLog.count({ where });

      return {
        success: true,
        data: logs,
        pagination: {
          total,
          limit: parseInt(limit, 10),
          offset: parseInt(offset, 10),
        },
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch audit logs');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch audit logs',
      });
    }
  });
};

export default systemRoutes;
