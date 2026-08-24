import { Job } from 'bullmq';
export interface BotCommandJob {
    botId: string;
    command: 'START' | 'PAUSE' | 'RESUME' | 'STOP' | 'CANCEL_ALL';
}
export interface BacktestJob {
    backtestId: string;
    config: any;
}
export interface ReconciliationJob {
    botId?: string;
}
export interface MarketDataSyncJob {
    symbol: string;
}
export declare class QueueManager {
    private connection;
    private botCommandQueue?;
    private backtestQueue?;
    private reconciliationQueue?;
    private marketDataSyncQueue?;
    constructor();
    initialize(): Promise<void>;
    registerBotCommandProcessor(processor: (job: Job<BotCommandJob>) => Promise<void>): void;
    registerBacktestProcessor(processor: (job: Job<BacktestJob>) => Promise<any>): void;
    registerReconciliationProcessor(processor: (job: Job<ReconciliationJob>) => Promise<void>): void;
    registerMarketDataSyncProcessor(processor: (job: Job<MarketDataSyncJob>) => Promise<void>): void;
    addBotCommand(job: BotCommandJob): Promise<void>;
    addBacktest(job: BacktestJob): Promise<string>;
    addReconciliation(job: ReconciliationJob): Promise<void>;
    addMarketDataSync(symbol: string): Promise<void>;
    close(): Promise<void>;
}
//# sourceMappingURL=queue-manager.d.ts.map