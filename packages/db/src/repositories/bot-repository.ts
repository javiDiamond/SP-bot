import { prisma } from '../prisma-client';
import type { Bot, Prisma } from '../../generated';

export class BotRepository {
  async findById(id: string): Promise<Bot | null> {
    return prisma.bot.findUnique({
      where: { id },
      include: {
        gridConfig: true,
        runtimeState: true,
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
        gridConfig: true,
        runtimeState: true,
        exchangeAccount: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveBots(): Promise<Bot[]> {
    return prisma.bot.findMany({
      where: {
        enabled: true,
        status: {
          in: ['RUNNING', 'STARTING'],
        },
      },
      include: {
        gridConfig: true,
        runtimeState: true,
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
    if (status) where.status = status;
    if (symbol) where.symbol = symbol;
    if (tradingMode) where.tradingMode = tradingMode;

    const [bots, total] = await Promise.all([
      prisma.bot.findMany({
        where,
        include: {
          gridConfig: true,
          runtimeState: true,
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
    if (status) where.status = status;
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
        status,
        lastError: errorMessage,
        lastActivityAt: new Date(),
      },
    });
  }

  async incrementMetrics(
    id: string,
    metrics: {
      totalTrades?: number;
      realizedProfit?: number;
      feesPaid?: number;
    }
  ): Promise<Bot> {
    return prisma.bot.update({
      where: { id },
      data: {
        totalTrades: {
          increment: metrics.totalTrades ?? 0,
        },
        realizedProfit: {
          increment: metrics.realizedProfit ?? 0,
        },
        feesPaid: {
          increment: metrics.feesPaid ?? 0,
        },
      },
    });
  }
}

export const botRepository = new BotRepository();
