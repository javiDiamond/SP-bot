import { prisma } from '../prisma-client';
import type { Order, Prisma } from '../../generated';

export class OrderRepository {
  async findById(id: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { id },
      include: {
        bot: true,
        fills: true,
      },
    });
  }

  async findByClientOrderId(
    clientOrderId: string,
    botId?: string
  ): Promise<Order | null> {
    const where: Prisma.OrderWhereInput = { clientOrderId };
    if (botId) where.botId = botId;
    
    return prisma.order.findFirst({
      where,
      include: {
        bot: true,
        fills: true,
      },
    });
  }

  async findByBotId(botId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<Order[]> {
    const { limit = 100, offset = 0, status } = options || {};
    
    const where: Prisma.OrderWhereInput = { botId };
    if (status) where.status = status;

    return prisma.order.findMany({
      where,
      include: {
        fills: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
  }

  async findOpenOrdersByBotId(botId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: {
        botId,
        status: {
          in: ['NEW', 'PARTIALLY_FILLED', 'PENDING'],
        },
      },
      include: {
        fills: true,
      },
    });
  }

  async create(data: Prisma.OrderCreateInput): Promise<Order> {
    return prisma.order.create({
      data,
    });
  }

  async update(id: string, data: Prisma.OrderUpdateInput): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data,
    });
  }

  async updateByClientOrderId(
    clientOrderId: string,
    data: Prisma.OrderUpdateInput
  ): Promise<Order | null> {
    const order = await prisma.order.findFirst({
      where: { clientOrderId },
    });

    if (!order) return null;

    return prisma.order.update({
      where: { id: order.id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.order.delete({
      where: { id },
    });
  }

  async list(options?: {
    botId?: string;
    userId?: string;
    symbol?: string;
    status?: string;
    side?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number }> {
    const {
      botId,
      userId,
      symbol,
      status,
      side,
      limit = 100,
      offset = 0,
    } = options || {};

    const where: Prisma.OrderWhereInput = {};
    if (botId) where.botId = botId;
    if (symbol) where.symbol = symbol;
    if (status) where.status = status;
    if (side) where.side = side;
    if (userId) {
      where.bot = {
        userId,
      };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          bot: true,
          fills: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  async count(options?: {
    botId?: string;
    status?: string;
  }): Promise<number> {
    const { botId, status } = options || {};
    const where: Prisma.OrderWhereInput = {};
    if (botId) where.botId = botId;
    if (status) where.status = status;
    return prisma.order.count({ where });
  }

  async cancelAllByBotId(botId: string): Promise<number> {
    const result = await prisma.order.updateMany({
      where: {
        botId,
        status: {
          in: ['NEW', 'PARTIALLY_FILLED', 'PENDING'],
        },
      },
      data: {
        status: 'CANCELED',
      },
    });
    return result.count;
  }
}

export const orderRepository = new OrderRepository();
