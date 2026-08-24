import type { Fill, Prisma } from '../../generated';
export declare class FillRepository {
    findById(id: string): Promise<Fill | null>;
    findByOrderId(orderId: string): Promise<Fill[]>;
    findByBotId(botId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<Fill[]>;
    create(data: Prisma.FillCreateInput): Promise<Fill>;
    update(id: string, data: Prisma.FillUpdateInput): Promise<Fill>;
    delete(id: string): Promise<void>;
    list(options?: {
        botId?: string;
        orderId?: string;
        userId?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        fills: Fill[];
        total: number;
    }>;
    count(options?: {
        botId?: string;
        orderId?: string;
    }): Promise<number>;
    getTotalVolumeByBotId(botId: string): Promise<{
        buyVolume: number;
        sellVolume: number;
    }>;
    getTotalFeesByBotId(botId: string): Promise<number>;
}
export declare const fillRepository: FillRepository;
