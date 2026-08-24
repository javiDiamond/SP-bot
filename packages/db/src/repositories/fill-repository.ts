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
      orderBy: { timestamp: 'desc' },
    });
  }

  async findByBotId(botId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<Fill[]> {
    const { limit = 100, offset = 0 } = options || {};

    return prisma.fill.findMany({
      where: { botId },
      orderBy: { timestamp: 'desc' },
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
    limit?: number;
    offset?: number;
  }): Promise<{ fills: Fill[]; total: number }> {
    const {
      botId,
      orderId,
      userId,
      limit = 100,
      offset = 0,
    } = options || {};

    const where: Prisma.FillWhereInput = {};
    if (botId) where.botId = botId;
    if (orderId) where.orderId = orderId;
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
        orderBy: { timestamp: 'desc' },
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
        where: { 
          botId, 
          isBuyer: true 
        },
        _sum: { quantity: true },
      }),
      prisma.fill.aggregate({
        where: { 
          botId, 
          isBuyer: false 
        },
        _sum: { quantity: true },
      }),
    ]);

    return {
      buyVolume: Number(buyResult._sum?.quantity ?? 0),
      sellVolume: Number(sellResult._sum?.quantity ?? 0),
    };
  }

  async getTotalFeesByBotId(botId: string): Promise<number> {
    const result = await prisma.fill.aggregate({
      where: { botId },
      _sum: { fee: true },
    });
    return Number(result._sum?.fee ?? 0);
  }
}

export const fillRepository = new FillRepository();
