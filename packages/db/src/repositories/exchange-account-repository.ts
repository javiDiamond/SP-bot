import { prisma } from '../prisma-client';
import type { ExchangeAccount, Prisma } from '../../generated';

export class ExchangeAccountRepository {
  async findById(id: string): Promise<ExchangeAccount | null> {
    return prisma.exchangeAccount.findUnique({
      where: { id },
      include: {
        user: true,
        bots: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async findByUserId(userId: string): Promise<ExchangeAccount[]> {
    return prisma.exchangeAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.ExchangeAccountCreateInput): Promise<ExchangeAccount> {
    return prisma.exchangeAccount.create({
      data,
    });
  }

  async update(
    id: string,
    data: Prisma.ExchangeAccountUpdateInput
  ): Promise<ExchangeAccount> {
    return prisma.exchangeAccount.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.exchangeAccount.delete({
      where: { id },
    });
  }

  async list(): Promise<ExchangeAccount[]> {
    return prisma.exchangeAccount.findMany({
      include: {
        user: true,
        _count: {
          select: {
            bots: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(): Promise<number> {
    return prisma.exchangeAccount.count();
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.exchangeAccount.count({
      where: { userId },
    });
  }
}

export const exchangeAccountRepository = new ExchangeAccountRepository();
