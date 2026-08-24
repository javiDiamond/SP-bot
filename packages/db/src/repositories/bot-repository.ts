import { prisma } from '../prisma-client';
import type { Bot, Prisma } from '../../generated';

export class BotRepository {
  async findById(id: string): Promise<Bot | null> {
    return prisma.bot.findUnique({
      where: { id },
      include: {
        exchangeAccount: true,
        user: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        fills: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        pnlSnapshots: {
          orderBy: { timestamp: 'desc' },
          take: 100,
        },
      },
    });
  }

  async findByUserId(userId: string): Promise<Bot[]> {
    return prisma.bot.findMany({
      where: { userId },
      include: {
        exchangeAccount: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveBots(): Promise<Bot[]> {
    return prisma.bot.findMany({
      where: {
        status: {
          in: ['RUNNING', 'STARTING'] as any[],
        },
      },
      include: {
        exchangeAccount: true,
      },
    });
  }

  async create(data: Prisma.BotCreateInput): Promise<Bot> {
    return prisma.bot.create({
      data,
    });
  }

  async update(id: string, data: Prisma.BotUpdateInput): Promise<Bot> {
    return prisma.bot.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.bot.delete({
      where: { id },
    });
  }

  async list(options?: {
    userId?: string;
    status?: string;
    symbol?: string;
    tradingMode?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ bots: Bot[]; total: number }> {
    const { userId, status, symbol, tradingMode, limit = 50, offset = 0 } = options || {};

    const where: Prisma.BotWhereInput = {};
    if (userId) where.userId = userId;
    if (status) where.status = status as any;
    if (symbol) where.symbol = symbol;
    if (tradingMode) where.tradingMode = tradingMode as any;

    const [bots, total] = await Promise.all([
      prisma.bot.findMany({
        where,
        include: {
          exchangeAccount: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.bot.count({ where }),
    ]);

    return { bots, total };
  }

  async count(options?: {
    userId?: string;
    status?: string;
  }): Promise<number> {
    const { userId, status } = options || {};
    const where: Prisma.BotWhereInput = {};
    if (userId) where.userId = userId;
    if (status) where.status = status as any;
    return prisma.bot.count({ where });
  }

  async updateStatus(
    id: string,
    status: string,
    errorMessage?: string
  ): Promise<Bot> {
    return prisma.bot.update({
      where: { id },
      data: {
        status: status as any,
        lastError: errorMessage,
        lastActivityAt: new Date(),
      },
    });
  }

  async incrementMetrics(
    id: string,
    metrics: {
      totalBuys?: number;
      totalSells?: number;
      totalGridCycles?: number;
      realizedPnL?: number;
      totalFeesPaid?: number;
    }
  ): Promise<Bot> {
    return prisma.bot.update({
      where: { id },
      data: {
        totalBuys: {
          increment: metrics.totalBuys ?? 0,
        },
        totalSells: {
          increment: metrics.totalSells ?? 0,
        },
        totalGridCycles: {
          increment: metrics.totalGridCycles ?? 0,
        },
        realizedPnL: {
          increment: metrics.realizedPnL ?? 0,
        },
        totalFeesPaid: {
          increment: metrics.totalFeesPaid ?? 0,
        },
      },
    });
  }
}

export const botRepository = new BotRepository();
