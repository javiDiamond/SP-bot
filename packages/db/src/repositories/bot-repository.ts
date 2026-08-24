import { prisma } from '../prisma-client';
import type { Bot, Prisma } from '../../generated';

export class BotRepository {
  async findById(id: string): Promise<Bot | null> {
    return prisma.bot.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        fills: {
          orderBy: { timestamp: 'desc' },
          take: 50,
        },
        gridLevels: {
          orderBy: { levelIndex: 'asc' },
        },
        pnlSnapshots: {
          orderBy: { timestamp: 'desc' },
          take: 100,
        },
        eventLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
  }

  async findByUserId(userId: string): Promise<Bot[]> {
    return prisma.bot.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            orders: true,
            fills: true,
            gridLevels: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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

  async updateStatus(
    id: string,
    status: string,
    errorMessage?: string
  ): Promise<Bot> {
    const updateData: Prisma.BotUpdateInput = {
      status: status as any,
    };

    if (status === 'RUNNING' && !errorMessage) {
      updateData.startedAt = new Date();
    } else if (status === 'STOPPED' || status === 'ERROR' || status === 'KILLED') {
      updateData.stoppedAt = new Date();
    }

    if (errorMessage && status === 'ERROR') {
      // Store error in runtimeState JSON
      const existingBot = await this.findById(id);
      const runtimeState = (existingBot?.runtimeState as any) || {};
      updateData.runtimeState = { ...runtimeState, lastError: errorMessage };
    }

    return prisma.bot.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.bot.delete({
      where: { id },
    });
  }

  async list(options?: {
    userId?: string;
    symbol?: string;
    status?: string;
    mode?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ bots: Bot[]; total: number }> {
    const {
      userId,
      symbol,
      status,
      mode,
      limit = 50,
      offset = 0,
    } = options || {};

    const where: Prisma.BotWhereInput = {};
    if (userId) where.userId = userId;
    if (symbol) where.symbol = symbol;
    if (status) where.status = status as any;
    if (mode) where.mode = mode as any;

    const [bots, total] = await Promise.all([
      prisma.bot.findMany({
        where,
        include: {
          _count: {
            select: {
              orders: true,
              fills: true,
              gridLevels: true,
            },
          },
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
    mode?: string;
  }): Promise<number> {
    const { userId, status, mode } = options || {};
    const where: Prisma.BotWhereInput = {};
    if (userId) where.userId = userId;
    if (status) where.status = status as any;
    if (mode) where.mode = mode as any;
    return prisma.bot.count({ where });
  }

  async findActiveBots(): Promise<Bot[]> {
    return prisma.bot.findMany({
      where: {
        status: {
          in: ['RUNNING', 'STARTING', 'PAUSING'] as any[],
        },
      },
      include: {
        gridLevels: true,
        eventLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async incrementStats(
    id: string,
    stats: {
      totalBuys?: number;
      totalSells?: number;
      totalGridCycles?: number;
      realizedPnL?: string;
      totalFeesPaid?: string;
    }
  ): Promise<Bot> {
    const updateData: Prisma.BotUpdateInput = {};

    if (stats.totalBuys !== undefined) {
      updateData.totalBuys = { increment: stats.totalBuys };
    }
    if (stats.totalSells !== undefined) {
      updateData.totalSells = { increment: stats.totalSells };
    }
    if (stats.totalGridCycles !== undefined) {
      updateData.totalGridCycles = { increment: stats.totalGridCycles };
    }
    if (stats.realizedPnL !== undefined) {
      updateData.realizedPnL = { increment: parseFloat(stats.realizedPnL) };
    }
    if (stats.totalFeesPaid !== undefined) {
      updateData.totalFeesPaid = { increment: parseFloat(stats.totalFeesPaid) };
    }

    return prisma.bot.update({
      where: { id },
      data: updateData,
    });
  }
}

export const botRepository = new BotRepository();
