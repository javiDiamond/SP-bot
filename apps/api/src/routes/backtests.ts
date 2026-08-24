/**
 * Backtests route - Run and manage backtests
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import getPrismaClient from '../lib/database.js';

const backtestRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = getPrismaClient();

  const createBacktestSchema = z.object({
    symbol: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    resolution: z.string(),
    gridType: z.enum(['ARITHMETIC', 'GEOMETRIC']),
    lowerPrice: z.string(),
    upperPrice: z.string(),
    gridCount: z.number().int().min(2),
    totalInvestmentQuote: z.string(),
    makerOnly: z.boolean().default(true),
    minProfitAfterFeesBps: z.number().int().min(0).default(10),
  });

  /**
   * GET /api/backtests
   * Get all backtests
   */
  fastify.get('/', async (request, reply) => {
    try {
      const backtests = await prisma.backtest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return {
        success: true,
        data: backtests,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch backtests');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch backtests',
      });
    }
  });

  /**
   * GET /api/backtests/:id
   * Get specific backtest details
   */
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const backtest = await prisma.backtest.findUnique({
        where: { id },
        include: {
          trades: {
            orderBy: { timestamp: 'asc' },
          },
        },
      });

      if (!backtest) {
        return reply.code(404).send({
          success: false,
          error: 'Backtest not found',
        });
      }

      return {
        success: true,
        data: backtest,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch backtest');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch backtest',
      });
    }
  });

  /**
   * POST /api/backtests
   * Create and run a new backtest
   */
  fastify.post('/', async (request, reply) => {
    try {
      const body = request.body as any;
      const validated = createBacktestSchema.parse(body);

      // Create backtest record with PENDING status
      const backtest = await prisma.backtest.create({
        data: {
          userId: 'system',
          symbol: validated.symbol,
          startTime: new Date(validated.startTime),
          endTime: new Date(validated.endTime),
          resolution: validated.resolution,
          config: validated,
          status: 'PENDING',
        },
      });

      // In production, this would queue the backtest job via Redis/BullMQ
      // For now, we'll just return the pending backtest
      fastify.log.info({ backtestId: backtest.id }, 'Backtest created');

      return {
        success: true,
        data: backtest,
        message: 'Backtest queued for processing',
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      fastify.log.error(error, 'Failed to create backtest');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to create backtest',
      });
    }
  });

  /**
   * DELETE /api/backtests/:id
   * Delete a backtest
   */
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      await prisma.backtest.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Backtest deleted',
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to delete backtest');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to delete backtest',
      });
    }
  });

  /**
   * GET /api/backtests/:id/export
   * Export backtest results
   */
  fastify.get('/:id/export', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { format = 'json' } = request.query as { format?: string };
      
      const backtest = await prisma.backtest.findUnique({
        where: { id },
        include: {
          trades: {
            orderBy: { timestamp: 'asc' },
          },
        },
      });

      if (!backtest) {
        return reply.code(404).send({
          success: false,
          error: 'Backtest not found',
        });
      }

      if (format === 'csv') {
        // Export as CSV
        const headers = ['timestamp', 'type', 'price', 'quantity', 'fee', 'pnl'];
        const rows = backtest.trades.map(t => 
          [t.timestamp.toISOString(), t.type, t.price.toString(), t.quantity.toString(), t.fee?.toString() || '', t.pnl?.toString() || ''].join(',')
        );
        
        const csv = [headers.join(','), ...rows].join('\n');
        
        reply.header('Content-Type', 'text/csv');
        reply.header('Content-Disposition', `attachment; filename=backtest_${id}.csv`);
        return csv;
      }

      // Default JSON export
      return {
        success: true,
        data: backtest,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to export backtest');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to export backtest',
      });
    }
  });
};

export default backtestRoutes;
