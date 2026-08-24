import type { Order, Prisma } from '../../generated';
export declare class OrderRepository {
    findById(id: string): Promise<Order | null>;
    findByClientOrderId(clientOrderId: string): Promise<Order | null>;
    findByBotId(botId: string, options?: {
        limit?: number;
        offset?: number;
        status?: string;
    }): Promise<Order[]>;
    create(data: Prisma.OrderCreateInput): Promise<Order>;
    update(id: string, data: Prisma.OrderUpdateInput): Promise<Order>;
    updateStatus(id: string, status: string, executedQty?: string, executedSum?: string): Promise<Order>;
    delete(id: string): Promise<void>;
    list(options?: {
        botId?: string;
        symbol?: string;
        status?: string;
        side?: string;
        isDryRun?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<{
        orders: Order[];
        total: number;
    }>;
    findOpenOrders(botId?: string): Promise<Order[]>;
    count(options?: {
        botId?: string;
        status?: string;
        isDryRun?: boolean;
    }): Promise<number>;
}
export declare const orderRepository: OrderRepository;
