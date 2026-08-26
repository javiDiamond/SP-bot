/**
 * Balances routes — flat BalanceSnapshot rows per asset
 */

import { FastifyPluginAsync } from 'fastify';
import getPrismaClient from '../lib/database.js';
import { authenticate, getAuthUserId } from '../middleware/auth.js';

const balancesRoutes: FastifyPluginAsync = async fastify => {
  const prisma = getPrismaClient();

  fastify.addHook('preHandler', authenticate);

  /**
   * GET /api/balances/current
   * Latest snapshot per asset for the user's accounts (dry-run aware)
   */
  fastify.get('/current', async (request, reply) => {
    try {
      const userId = getAuthUserId(request);
      const accounts = await prisma.exchangeAccount.findMany({
        where: { userId },
        select: { id: true, name: true },
      });
      const accountIds = accounts.map(a => a.id);

      const snapshots = await prisma.balanceSnapshot.findMany({
        where: {
          OR: [{ exchangeAccountId: { in: accountIds } }, { botId: { not: null } }],
        },
        orderBy: { timestamp: 'desc' },
        take: 2000,
      });

      // Keep only the newest row per (asset, exchangeAccountId, isDryRun)
      const latest = new Map<string, (typeof snapshots)[number]>();
      for (const snap of snapshots) {
        const key = `${snap.asset}:${snap.exchangeAccountId ?? 'null'}:${snap.isDryRun}`;
        if (!latest.has(key)) latest.set(key, snap);
      }

      return { success: true, data: Array.from(latest.values()) };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch balances');
      return reply.code(500).send({ success: false, error: error.message || 'Failed to fetch balances' });
    }
  });

  /**
   * GET /api/balances/history?asset=USDT&accountId=..&limit=200
   */
  fastify.get('/history', async (request, reply) => {
    try {
      const userId = getAuthUserId(request);
      const query = request.query as {
        asset?: string;
        accountId?: string;
        from?: string;
        to?: string;
        limit?: string;
      };

      const accounts = await prisma.exchangeAccount.findMany({
        where: { userId },
        select: { id: true },
      });
      const accountIds = accounts.map(a => a.id);

      if (query.accountId && !accountIds.includes(query.accountId)) {
        return reply.code(403).send({ success: false, error: 'Account not owned' });
      }

      const history = await prisma.balanceSnapshot.findMany({
        where: {
          ...(query.asset ? { asset: query.asset } : {}),
          ...(query.accountId
            ? { exchangeAccountId: query.accountId }
            : { exchangeAccountId: { in: accountIds } }),
          ...(query.from || query.to
            ? {
                timestamp: {
                  ...(query.from ? { gte: new Date(query.from) } : {}),
                  ...(query.to ? { lte: new Date(query.to) } : {}),
                },
              }
            : {}),
        },
        orderBy: { timestamp: 'desc' },
        take: Math.min(Number(query.limit || 200), 1000),
      });

      return { success: true, data: history };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch balance history');
      return reply.code(500).send({ success: false, error: error.message || 'Failed to fetch history' });
    }
  });
};

export default balancesRoutes;
