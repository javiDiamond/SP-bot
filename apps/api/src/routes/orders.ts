/**
 * Orders route - Get orders and fills
 */

import { FastifyPluginAsync } from 'fastify';
import getPrismaClient from '../lib/database.js';

const ordersRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = getPrismaClient();

  /**
   * GET /api/orders
   * Get all orders with optional filters
   */
  fastify.get('/', async (request, reply) => {
    try {
      const { 
        botId, 
        symbol, 
        status, 
        side,
        limit = '50',
        offset = '0' 
      } = request.query as any;

      const where: any = {};
      
      if (botId) where.botId = botId;
      if (symbol) where.symbol = symbol;
      if (status) where.status = status;
      if (side) where.side = side;

      const orders = await prisma.order.findMany({
        where,
        include: {
          bot: {
            select: {
              id: true,
              name: true,
              symbol: true,
            },
          },
          fills: {
            take: 10,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      });

      const total = await prisma.order.count({ where });

      return {
        success: true,
        data: orders,
        pagination: {
          total,
          limit: parseInt(limit, 10),
          offset: parseInt(offset, 10),
        },
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch orders');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch orders',
      });
    }
  });

  /**
   * GET /api/orders/:id
   * Get specific order details
   */
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          bot: true,
          fills: {
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      if (!order) {
        return reply.code(404).send({
          success: false,
          error: 'Order not found',
        });
      }

      return {
        success: true,
        data: order,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch order');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch order',
      });
    }
  });

  /**
   * GET /api/fills
   * Get all fills with optional filters
   */
  fastify.get('/fills', async (request, reply) => {
    try {
      const { 
        botId, 
        orderId, 
        symbol,
        limit = '50',
        offset = '0' 
      } = request.query as any;

      const where: any = {};
      
      if (botId) where.botId = botId;
      if (orderId) where.orderId = orderId;
      if (symbol) where.symbol = symbol;

      const fills = await prisma.fill.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              side: true,
              price: true,
              symbol: true,
            },
          },
          bot: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      });

      const total = await prisma.fill.count({ where });

      return {
        success: true,
        data: fills,
        pagination: {
          total,
          limit: parseInt(limit, 10),
          offset: parseInt(offset, 10),
        },
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch fills');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch fills',
      });
    }
  });
};

export default ordersRoutes;
