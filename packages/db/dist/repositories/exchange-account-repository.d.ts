import type { ExchangeAccount, Prisma } from '../../generated';
export declare class ExchangeAccountRepository {
    findById(id: string): Promise<ExchangeAccount | null>;
    findByUserId(userId: string): Promise<ExchangeAccount[]>;
    create(data: Prisma.ExchangeAccountCreateInput): Promise<ExchangeAccount>;
    update(id: string, data: Prisma.ExchangeAccountUpdateInput): Promise<ExchangeAccount>;
    delete(id: string): Promise<void>;
    list(): Promise<ExchangeAccount[]>;
    count(): Promise<number>;
    countByUserId(userId: string): Promise<number>;
}
export declare const exchangeAccountRepository: ExchangeAccountRepository;
