import type { Bot, Prisma } from '../../generated';
export declare class BotRepository {
    findById(id: string): Promise<Bot | null>;
    findByUserId(userId: string): Promise<Bot[]>;
    create(data: Prisma.BotCreateInput): Promise<Bot>;
    update(id: string, data: Prisma.BotUpdateInput): Promise<Bot>;
    updateStatus(id: string, status: string, errorMessage?: string): Promise<Bot>;
    delete(id: string): Promise<void>;
    list(options?: {
        userId?: string;
        symbol?: string;
        status?: string;
        mode?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        bots: Bot[];
        total: number;
    }>;
    count(options?: {
        userId?: string;
        status?: string;
        mode?: string;
    }): Promise<number>;
    findActiveBots(): Promise<Bot[]>;
    incrementStats(id: string, stats: {
        totalBuys?: number;
        totalSells?: number;
        totalGridCycles?: number;
        realizedPnL?: string;
        totalFeesPaid?: string;
    }): Promise<Bot>;
}
export declare const botRepository: BotRepository;
