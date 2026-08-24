import { prisma } from '../prisma-client';
import type { Backtest, Prisma } from '../../generated';

export class BacktestRepository {
  async findById(id: string): Promise<Backtest | null> {
    return prisma.backtest.findUnique({
      where: { id },
      include: {
        trades: {
          orderBy: { timestamp: 'asc' },
        },
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
    if (status) where.status = status as any;

    const [backtests, total] = await Promise.all([
      prisma.backtest.findMany({
        where,
        include: {
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
    if (status) where.status = status as any;
    return prisma.backtest.count({ where });
  }

  async updateStatus(
    id: string,
    status: string,
    errorMessage?: string
  ): Promise<Backtest> {
    const updateData: Prisma.BacktestUpdateInput = {
      status: status as any,
      completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined,
    };
    
    if (errorMessage && status === 'FAILED') {
      // Store error message in results JSON since there's no error field
      const existingBacktest = await this.findById(id);
      const results = existingBacktest?.results as any || {};
      updateData.results = { ...results, error: errorMessage };
    }
    
    return prisma.backtest.update({
      where: { id },
      data: updateData,
    });
  }
}

export const backtestRepository = new BacktestRepository();
