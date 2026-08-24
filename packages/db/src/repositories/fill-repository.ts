import { prisma } from '../prisma-client';
import type { Fill, Prisma } from '../../generated';

export class FillRepository {
  async findById(id: string): Promise<Fill | null> {
    return prisma.fill.findUnique({
      where: { id },
      include: {
        order: true,
        bot: true,
      },
    });
  }

  async findByOrderId(orderId: string): Promise<Fill[]> {
    return prisma.fill.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByBotId(botId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<Fill[]> {
    const { limit = 100, offset = 0 } = options || {};

    return prisma.fill.findMany({
      where: { botId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
  }

  async create(data: Prisma.FillCreateInput): Promise<Fill> {
    return prisma.fill.create({
      data,
    });
  }

  async update(id: string, data: Prisma.FillUpdateInput): Promise<Fill> {
    return prisma.fill.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.fill.delete({
      where: { id },
    });
  }

  async list(options?: {
    botId?: string;
    orderId?: string;
    userId?: string;
    symbol?: string;
    side?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ fills: Fill[]; total: number }> {
    const {
      botId,
      orderId,
      userId,
      symbol,
      side,
      limit = 100,
      offset = 0,
    } = options || {};

    const where: Prisma.FillWhereInput = {};
    if (botId) where.botId = botId;
    if (orderId) where.orderId = orderId;
    if (symbol) where.symbol = symbol;
    if (side) where.side = side;
    if (userId) {
      where.bot = {
        userId,
      };
    }

    const [fills, total] = await Promise.all([
      prisma.fill.findMany({
        where,
        include: {
          order: true,
          bot: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.fill.count({ where }),
    ]);

    return { fills, total };
  }

  async count(options?: {
    botId?: string;
    orderId?: string;
  }): Promise<number> {
    const { botId, orderId } = options || {};
    const where: Prisma.FillWhereInput = {};
    if (botId) where.botId = botId;
    if (orderId) where.orderId = orderId;
    return prisma.fill.count({ where });
  }

  async getTotalVolumeByBotId(botId: string): Promise<{
    buyVolume: number;
    sellVolume: number;
  }> {
    const [buyResult, sellResult] = await Promise.all([
      prisma.fill.aggregate({
        where: { botId, side: 'BUY' },
        _sum: { quantity: true },
      }),
      prisma.fill.aggregate({
        where: { botId, side: 'SELL' },
        _sum: { quantity: true },
      }),
    ]);

    return {
      buyVolume: Number(buyResult._sum.quantity) || 0,
      sellVolume: Number(sellResult._sum.quantity) || 0,
    };
  }

  async getTotalFeesByBotId(botId: string): Promise<number> {
    const result = await prisma.fill.aggregate({
      where: { botId },
      _sum: { feeAmount: true },
    });
    return Number(result._sum.feeAmount) || 0;
  }
}

export const fillRepository = new FillRepository();
