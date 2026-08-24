import { prisma } from '../prisma-client';
import type { Order, Prisma } from '../../generated';

export class OrderRepository {
  async findById(id: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { id },
      include: {
        fills: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
  }

  async findByClientOrderId(clientOrderId: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { clientOrderId },
      include: {
        fills: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
  }

  async findByBotId(botId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<Order[]> {
    const { limit = 50, offset = 0, status } = options || {};
    
    const where: Prisma.OrderWhereInput = { botId };
    if (status) where.status = status as any;

    return prisma.order.findMany({
      where,
      include: {
        fills: {
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
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

  async updateStatus(
    id: string,
    status: string,
    executedQty?: string,
    executedSum?: string
  ): Promise<Order> {
    const updateData: Prisma.OrderUpdateInput = {
      status: status as any,
    };

    if (executedQty !== undefined) {
      updateData.executedQty = parseFloat(executedQty);
    }
    if (executedSum !== undefined) {
      updateData.executedSum = parseFloat(executedSum);
    }
    if (status === 'FILLED' || status === 'PARTIALLY_FILLED') {
      updateData.executedAt = new Date();
    }

    return prisma.order.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.order.delete({
      where: { id },
    });
  }

  async list(options?: {
    botId?: string;
    symbol?: string;
    status?: string;
    side?: string;
    isDryRun?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number }> {
    const {
      botId,
      symbol,
      status,
      side,
      isDryRun,
      limit = 50,
      offset = 0,
    } = options || {};

    const where: Prisma.OrderWhereInput = {};
    if (botId) where.botId = botId;
    if (symbol) where.symbol = symbol;
    if (status) where.status = status as any;
    if (side) where.side = side as any;
    if (isDryRun !== undefined) where.isDryRun = isDryRun;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          fills: {
            orderBy: { timestamp: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  async findOpenOrders(botId?: string): Promise<Order[]> {
    const where: Prisma.OrderWhereInput = {
      status: {
        in: ['NEW', 'PARTIALLY_FILLED', 'PENDING'] as any[],
      },
    };
    
    if (botId) {
      where.botId = botId;
    }

    return prisma.order.findMany({
      where,
      include: {
        fills: true,
      },
    });
  }

  async count(options?: {
    botId?: string;
    status?: string;
    isDryRun?: boolean;
  }): Promise<number> {
    const { botId, status, isDryRun } = options || {};
    const where: Prisma.OrderWhereInput = {};
    if (botId) where.botId = botId;
    if (status) where.status = status as any;
    if (isDryRun !== undefined) where.isDryRun = isDryRun;
    return prisma.order.count({ where });
  }
}

export const orderRepository = new OrderRepository();
