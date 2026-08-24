import { Bot, GridConfig, ExchangeAccount } from '@wallex/db';
import { EventEmitter } from 'events';
export interface OrderPlacedEvent {
    botId: string;
    orderId: string;
    clientId: string;
    side: 'BUY' | 'SELL';
    price: string;
    quantity: string;
}
export interface OrderFilledEvent {
    botId: string;
    orderId: string;
    fillId: string;
    side: 'BUY' | 'SELL';
    price: string;
    quantity: string;
    fee: string;
}
export declare class BotEngine extends EventEmitter {
    private bot;
    private gridConfig;
    private exchangeAccount;
    private exchange;
    private status;
    private gridLevels;
    private activeOrders;
    private reconciliationInterval?;
    private isHealthyFlag;
    constructor(bot: Bot, gridConfig: GridConfig, exchangeAccount: ExchangeAccount);
    start(): Promise<void>;
    stop(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    cancelAllOrders(): Promise<void>;
    isHealthy(): boolean;
    private validateConfig;
    private generateGridLevels;
    private reconcileOrders;
    private placeInitialOrders;
    private calculateOrderQuantity;
    private startReconciliationLoop;
    private updateStatus;
}
//# sourceMappingURL=bot-engine.d.ts.map