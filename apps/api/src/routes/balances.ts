/**
 * Balances route - Get account balances
 */

import { FastifyPluginAsync } from 'fastify';
import getPrismaClient from '../lib/database.js';

const balancesRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = getPrismaClient();

  /**
   * GET /api/balances
   * Get all balances
   */
  fastify.get('/', async (request, reply) => {
    try {
      const balances = await prisma.balanceSnapshot.findMany({
        take: 1,
        orderBy: { timestamp: 'desc' },
      });

      return {
        success: true,
        data: balances[0] || { assets: [] },
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch balances');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch balances',
      });
    }
  });

  /**
   * GET /api/balances/history
   * Get balance history for an asset
   */
  fastify.get('/history/:asset', async (request, reply) => {
    try {
      const { asset } = request.params as { asset: string };
      const { limit = '100' } = request.query as { limit?: string };

      const history = await prisma.balanceSnapshot.findMany({
        where: {
          assets: {
            path: [`[${asset}]`],
          },
        },
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit, 10),
      });

      return {
        success: true,
        data: history,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch balance history');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch balance history',
      });
    }
  });
};

export default balancesRoutes;
