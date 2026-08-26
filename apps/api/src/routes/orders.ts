/**
 * Orders & fills routes
 */

import { FastifyPluginAsync } from 'fastify';
import { OrderSide, OrderStatus } from '@wallex/db';
import getPrismaClient from '../lib/database.js';
import { authenticate, getAuthUserId } from '../middleware/auth.js';

const ordersRoutes: FastifyPluginAsync = async fastify => {
  const prisma = getPrismaClient();

  fastify.addHook('preHandler', authenticate);

  const userBotWhere = (userId: string, botId?: string) => ({
    bot: { userId, ...(botId ? { id: botId } : {}) },
  });

  /**
   * GET /api/orders?botId=..&symbol=..&status=..&side=..&page=1&perPage=50
   */
  fastify.get('/', async (request, reply) => {
    try {
      const userId = getAuthUserId(request);
      const query = request.query as {
        botId?: string;
        symbol?: string;
        status?: string;
        side?: string;
        page?: string;
        perPage?: string;
      };

      const page = Math.max(Number(query.page || 1), 1);
      const perPage = Math.min(Math.max(Number(query.perPage || 50), 1), 200);

      const where = {
        ...userBotWhere(userId, query.botId),
        ...(query.symbol ? { symbol: query.symbol } : {}),
        ...(query.status ? { status: query.status as OrderStatus } : {}),
        ...(query.side ? { side: query.side as OrderSide } : {}),
      };

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * perPage,
          take: perPage,
          include: { fills: true },
        }),
        prisma.order.count({ where }),
      ]);

      return { success: true, data: orders, pagination: { page, perPage, total } };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch orders');
      return reply.code(500).send({ success: false, error: error.message || 'Failed to fetch orders' });
    }
  });

  /**
   * GET /api/orders/fills?botId=..&symbol=..&side=BUY|SELL&from=..&to=..
   * Fill has no symbol/side columns: symbol via order, side via isBuyer.
   */
  fastify.get('/fills', async (request, reply) => {
    try {
      const userId = getAuthUserId(request);
      const query = request.query as {
        botId?: string;
        symbol?: string;
        side?: 'BUY' | 'SELL';
        from?: string;
        to?: string;
        page?: string;
        perPage?: string;
      };

      const page = Math.max(Number(query.page || 1), 1);
      const perPage = Math.min(Math.max(Number(query.perPage || 50), 1), 200);

      const where = {
        ...userBotWhere(userId, query.botId),
        ...(query.symbol ? { order: { symbol: query.symbol } } : {}),
        ...(query.side ? { isBuyer: query.side === 'BUY' } : {}),
        ...(query.from || query.to
          ? {
              timestamp: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
              },
            }
          : {}),
      };

      const [fills, total] = await Promise.all([
        prisma.fill.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip: (page - 1) * perPage,
          take: perPage,
          include: { order: { select: { symbol: true, side: true, clientOrderId: true } } },
        }),
        prisma.fill.count({ where }),
      ]);

      const data = fills.map(f => ({
        ...f,
        side: f.isBuyer ? 'BUY' : 'SELL',
        symbol: f.order?.symbol,
      }));

      return { success: true, data, pagination: { page, perPage, total } };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch fills');
      return reply.code(500).send({ success: false, error: error.message || 'Failed to fetch fills' });
    }
  });

  /**
   * GET /api/orders/fills/export.csv
   */
  fastify.get('/fills/export.csv', async (request, reply) => {
    try {
      const userId = getAuthUserId(request);
      const query = request.query as { botId?: string; symbol?: string };

      const fills = await prisma.fill.findMany({
        where: {
          ...userBotWhere(userId, query.botId),
          ...(query.symbol ? { order: { symbol: query.symbol } } : {}),
        },
        orderBy: { timestamp: 'asc' },
        take: 10000,
        include: { order: { select: { symbol: true } } },
      });

      const header = 'timestamp,botId,symbol,side,price,quantity,sum,fee,feeAsset,isDryRun';
      const rows = fills.map(f =>
        [
          f.timestamp.toISOString(),
          f.botId,
          f.order?.symbol ?? '',
          f.isBuyer ? 'BUY' : 'SELL',
          f.price.toString(),
          f.quantity.toString(),
          f.sum.toString(),
          f.fee.toString(),
          f.feeAsset ?? '',
          f.isDryRun,
        ].join(','),
      );

      return reply
        .header('content-type', 'text/csv')
        .header('content-disposition', 'attachment; filename="fills.csv"')
        .send([header, ...rows].join('\n'));
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message || 'Export failed' });
    }
  });
};

export default ordersRoutes;
