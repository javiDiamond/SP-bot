/**
 * Backtests routes — creation (queued), results, comparison, exports, optimizations
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { CreateBacktestSchema } from '@wallex/shared';
import getPrismaClient from '../lib/database.js';
import { authenticate, getAuthUserId } from '../middleware/auth.js';
import { enqueueBacktestJob } from '../lib/queue.js';

const createOptimizationSchema = z.object({
  symbol: z.string().min(1),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  resolution: z.string(),
  baseConfig: CreateBacktestSchema.shape.config,
  ranges: z.record(
    z.object({
      param: z.string(),
      from: z.number().optional(),
      to: z.number().optional(),
      step: z.number().optional(),
      values: z.array(z.union([z.number(), z.string()])).optional(),
    }),
  ),
  maxCombos: z.number().int().min(1).max(200).default(50),
});

const backtestRoutes: FastifyPluginAsync = async fastify => {
  const prisma = getPrismaClient();

  fastify.addHook('preHandler', authenticate);

  /**
   * GET /api/backtests
   */
  fastify.get('/', async (request, reply) => {
    try {
      const userId = getAuthUserId(request);
      const backtests = await prisma.backtest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { trades: { select: { id: true } } },
      });

      const data = backtests.map(bt => {
        const { trades, ...rest } = bt;
        return { ...rest, tradeCount: trades.length };
      });

      return { success: true, data };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch backtests');
      return reply.code(500).send({ success: false, error: error.message || 'Failed to fetch backtests' });
    }
  });

  /**
   * GET /api/backtests/:id
   */
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const backtest = await prisma.backtest.findUnique({
        where: { id },
        include: { trades: { orderBy: { timestamp: 'asc' } } },
      });

      if (!backtest) {
        return reply.code(404).send({ success: false, error: 'Backtest not found' });
      }

      return { success: true, data: backtest };
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message || 'Failed to fetch backtest' });
    }
  });

  /**
   * POST /api/backtests — creates a PENDING row and enqueues the run
   */
  fastify.post('/', async (request, reply) => {
    try {
      const userId = getAuthUserId(request);
      const validated = CreateBacktestSchema.parse(request.body);

      const backtest = await prisma.backtest.create({
        data: {
          userId,
          name: validated.name,
          symbol: validated.symbol.toUpperCase(),
          dateFrom: new Date(validated.dateFrom),
          dateTo: new Date(validated.dateTo),
          resolution: validated.resolution,
          config: validated as unknown as object,
          status: 'PENDING',
        },
      });

      await enqueueBacktestJob({ type: 'RUN_BACKTEST', backtestId: backtest.id });

      return { success: true, data: backtest };
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return reply.code(400).send({ success: false, error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error, 'Failed to create backtest');
      return reply.code(500).send({ success: false, error: error.message || 'Failed to create backtest' });
    }
  });

  /**
   * POST /api/backtests/compare — side-by-side metrics for multiple runs
   */
  fastify.post('/compare', async (request, reply) => {
    try {
      const body = request.body as { ids?: string[] };
      if (!Array.isArray(body?.ids) || body.ids.length < 2 || body.ids.length > 5) {
        return reply.code(400).send({ success: false, error: 'Provide 2-5 backtest ids' });
      }

      const backtests = await prisma.backtest.findMany({
        where: { id: { in: body.ids } },
        include: { trades: { select: { id: true } } },
      });

      const data = backtests.map(bt => ({
        id: bt.id,
        name: bt.name,
        symbol: bt.symbol,
        dateFrom: bt.dateFrom,
        dateTo: bt.dateTo,
        resolution: bt.resolution,
        status: bt.status,
        results: bt.results,
        tradeCount: bt.trades.length,
        createdAt: bt.createdAt,
      }));

      return { success: true, data };
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message || 'Compare failed' });
    }
  });

  /**
   * GET /api/backtests/:id/trades.csv
   */
  fastify.get('/:id/trades.csv', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const backtest = await prisma.backtest.findUnique({
        where: { id },
        include: { trades: { orderBy: { timestamp: 'asc' } } },
      });
      if (!backtest) {
        return reply.code(404).send({ success: false, error: 'Backtest not found' });
      }

      const header = 'timestamp,side,price,quantity,fee,pnl';
      const rows = backtest.trades.map(t =>
        [t.timestamp.toISOString(), t.side, t.price.toString(), t.quantity.toString(), t.fee.toString(), t.pnl.toString()].join(','),
      );

      return reply
        .header('content-type', 'text/csv')
        .header('content-disposition', `attachment; filename="backtest-${id}-trades.csv"`)
        .send([header, ...rows].join('\n'));
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message || 'Export failed' });
    }
  });

  // ==========================================================================
  // Optimizations
  // ==========================================================================

  /**
   * POST /api/optimizations
   */
  fastify.post('/optimizations', async (request, reply) => {
    try {
      const userId = getAuthUserId(request);
      const validated = createOptimizationSchema.parse(request.body);

      const job = await prisma.optimizationJob.create({
        data: {
          userId,
          symbol: validated.symbol.toUpperCase(),
          dateFrom: new Date(validated.dateFrom),
          dateTo: new Date(validated.dateTo),
          resolution: validated.resolution,
          config: {
            base: validated.baseConfig,
            ranges: validated.ranges,
          } as object,
          maxCombos: validated.maxCombos,
          status: 'PENDING',
        },
      });

      await enqueueBacktestJob({ type: 'RUN_OPTIMIZATION', optimizationId: job.id });

      return { success: true, data: job };
    } catch (error: any) {
      if (error?.name === 'ZodError') {
        return reply.code(400).send({ success: false, error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error, 'Failed to create optimization');
      return reply.code(500).send({ success: false, error: error.message || 'Failed to create optimization' });
    }
  });

  /**
   * GET /api/optimizations/:id
   */
  fastify.get('/optimizations/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const job = await prisma.optimizationJob.findUnique({
        where: { id },
        include: { backtests: { select: { id: true, name: true, status: true, results: true } } },
      });
      if (!job) {
        return reply.code(404).send({ success: false, error: 'Optimization job not found' });
      }
      return { success: true, data: job };
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message || 'Failed to fetch optimization' });
    }
  });
};

export default backtestRoutes;
