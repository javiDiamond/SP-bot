/**
 * Bots route - Grid bot CRUD and management
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import getPrismaClient from '../lib/database.js';
import { config } from '../config.js';

const botsRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = getPrismaClient();

  const createBotSchema = z.object({
    name: z.string().min(1).max(50),
    symbol: z.string(),
    gridType: z.enum(['ARITHMETIC', 'GEOMETRIC']),
    lowerPrice: z.string(),
    upperPrice: z.string(),
    gridCount: z.number().int().min(2),
    totalInvestmentQuote: z.string().optional(),
    mode: z.enum(['DRY_RUN', 'LIVE']).default('DRY_RUN'),
    inventoryMode: z.enum(['EXISTING_ONLY', 'AUTO_REBALANCE', 'MANUAL']).default('EXISTING_ONLY'),
    makerOnly: z.boolean().default(true),
    minProfitAfterFeesBps: z.number().int().min(0).default(10),
    onRangeExit: z.enum(['PAUSE_KEEP_ORDERS', 'PAUSE_CANCEL_ALL', 'STOP_CANCEL_ALL', 'RECENTER', 'TRAILING']).default('PAUSE_KEEP_ORDERS'),
  });

  /**
   * GET /api/v1/bots
   * Get all bots for current user
   */
  fastify.get('/', async (request, reply) => {
    try {
      // For now, return all bots (auth will be added later)
      const bots = await prisma.bot.findMany({
        include: {
          gridLevels: {
            orderBy: { levelIndex: 'asc' },
          },
          orders: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: bots,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch bots');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch bots',
      });
    }
  });

  /**
   * GET /api/v1/bots/:id
   * Get specific bot details
   */
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const bot = await prisma.bot.findUnique({
        where: { id },
        include: {
          gridLevels: {
            orderBy: { levelIndex: 'asc' },
          },
          orders: {
            orderBy: { createdAt: 'desc' },
          },
          fills: {
            orderBy: { timestamp: 'desc' },
            take: 50,
          },
          pnlSnapshots: {
            orderBy: { timestamp: 'desc' },
            take: 100,
          },
        },
      });

      if (!bot) {
        return reply.code(404).send({
          success: false,
          error: 'Bot not found',
        });
      }

      return {
        success: true,
        data: bot,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch bot');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch bot',
      });
    }
  });

  /**
   * POST /api/v1/bots
   * Create a new bot
   */
  fastify.post('/', async (request, reply) => {
    try {
      const body = request.body as any;
      const validated = createBotSchema.parse(body);

      // Check if live trading is allowed
      if (validated.mode === 'LIVE' && !config.enableLiveTrading) {
        return reply.code(400).send({
          success: false,
          error: 'Live trading is disabled. Set ENABLE_LIVE_TRADING=true to enable.',
        });
      }

      // Validate price range
      const lower = parseFloat(validated.lowerPrice);
      const upper = parseFloat(validated.upperPrice);
      
      if (lower >= upper) {
        return reply.code(400).send({
          success: false,
          error: 'Lower price must be less than upper price',
        });
      }

      // Create bot
      const bot = await prisma.bot.create({
        data: {
          userId: 'system', // Will be replaced with auth user
          name: validated.name,
          symbol: validated.symbol,
          strategyType: 'GRID',
          mode: validated.mode,
          status: 'DRAFT',
          gridConfig: validated,
        },
      });

      return {
        success: true,
        data: bot,
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error, 'Failed to create bot');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to create bot',
      });
    }
  });

  /**
   * POST /api/v1/bots/:id/start
   * Start a bot
   */
  fastify.post('/:id/start', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const bot = await prisma.bot.update({
        where: { id },
        data: {
          status: 'STARTING',
          startedAt: new Date(),
        },
      });

      // In production, this would send a command to the worker via Redis queue
      fastify.log.info({ botId: id }, 'Bot start requested');

      return {
        success: true,
        data: bot,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to start bot');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to start bot',
      });
    }
  });

  /**
   * POST /api/v1/bots/:id/pause
   * Pause a running bot
   */
  fastify.post('/:id/pause', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const bot = await prisma.bot.update({
        where: { id },
        data: { status: 'PAUSED' },
      });

      return {
        success: true,
        data: bot,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to pause bot');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to pause bot',
      });
    }
  });

  /**
   * POST /api/v1/bots/:id/resume
   * Resume a paused bot
   */
  fastify.post('/:id/resume', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const bot = await prisma.bot.update({
        where: { id },
        data: { status: 'RUNNING' },
      });

      return {
        success: true,
        data: bot,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to resume bot');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to resume bot',
      });
    }
  });

  /**
   * POST /api/v1/bots/:id/stop
   * Stop a bot
   */
  fastify.post('/:id/stop', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const bot = await prisma.bot.update({
        where: { id },
        data: {
          status: 'STOPPED',
          stoppedAt: new Date(),
        },
      });

      return {
        success: true,
        data: bot,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to stop bot');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to stop bot',
      });
    }
  });

  /**
   * DELETE /api/v1/bots/:id
   * Delete a bot
   */
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      await prisma.bot.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Bot deleted',
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to delete bot');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to delete bot',
      });
    }
  });
};

export default botsRoutes;
