import { prisma } from '../prisma-client';
import type { Backtest, BacktestResult, Prisma } from '../../generated';

export class BacktestRepository {
  async findById(id: string): Promise<Backtest | null> {
    return prisma.backtest.findUnique({
      where: { id },
      include: {
        result: true,
        trades: {
          orderBy: { timestamp: 'asc' },
        },
        user: true,
      },
    });
  }

  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<Backtest[]> {
    const { limit = 50, offset = 0 } = options || {};

    return prisma.backtest.findMany({
      where: { userId },
      include: {
        result: true,
        _count: {
          select: {
            trades: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
  }

  async create(data: Prisma.BacktestCreateInput): Promise<Backtest> {
    return prisma.backtest.create({
      data,
    });
  }

  async update(id: string, data: Prisma.BacktestUpdateInput): Promise<Backtest> {
    return prisma.backtest.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.backtest.delete({
      where: { id },
    });
  }

  async list(options?: {
    userId?: string;
    symbol?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ backtests: Backtest[]; total: number }> {
    const {
      userId,
      symbol,
      status,
      limit = 50,
      offset = 0,
    } = options || {};

    const where: Prisma.BacktestWhereInput = {};
    if (userId) where.userId = userId;
    if (symbol) where.symbol = symbol;
    if (status) where.status = status;

    const [backtests, total] = await Promise.all([
      prisma.backtest.findMany({
        where,
        include: {
          result: true,
          user: true,
          _count: {
            select: {
              trades: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.backtest.count({ where }),
    ]);

    return { backtests, total };
  }

  async count(options?: {
    userId?: string;
    status?: string;
  }): Promise<number> {
    const { userId, status } = options || {};
    const where: Prisma.BacktestWhereInput = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    return prisma.backtest.count({ where });
  }

  async saveResult(
    backtestId: string,
    data: Prisma.BacktestResultCreateInput
  ): Promise<BacktestResult> {
    return prisma.backtestResult.create({
      data: {
        ...data,
        backtestId,
      },
    });
  }

  async saveTrades(
    backtestId: string,
    tradesData: Prisma.BacktestTradeCreateInput[]
  ): Promise<void> {
    if (tradesData.length === 0) return;

    await prisma.backtestTrade.createMany({
      data: tradesData.map((t) => ({
        ...t,
        backtestId,
      })),
    });
  }

  async updateStatus(
    id: string,
    status: string,
    errorMessage?: string
  ): Promise<Backtest> {
    return prisma.backtest.update({
      where: { id },
      data: {
        status,
        error: errorMessage,
        completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined,
      },
    });
  }
}

export const backtestRepository = new BacktestRepository();
