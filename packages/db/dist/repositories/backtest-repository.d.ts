import type { Backtest, Prisma } from '../../generated';
export declare class BacktestRepository {
    findById(id: string): Promise<Backtest | null>;
    findByUserId(userId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<Backtest[]>;
    create(data: Prisma.BacktestCreateInput): Promise<Backtest>;
    update(id: string, data: Prisma.BacktestUpdateInput): Promise<Backtest>;
    delete(id: string): Promise<void>;
    list(options?: {
        userId?: string;
        symbol?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        backtests: Backtest[];
        total: number;
    }>;
    count(options?: {
        userId?: string;
        status?: string;
    }): Promise<number>;
    updateStatus(id: string, status: string, errorMessage?: string): Promise<Backtest>;
}
export declare const backtestRepository: BacktestRepository;
