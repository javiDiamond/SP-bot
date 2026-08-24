import { BotEngine } from './engines/bot-engine';
import { EventEmitter } from 'events';
export declare class Worker extends EventEmitter {
    private botEngines;
    private queueManager;
    private reconciliationService;
    private marketDataService;
    private backtestRunner;
    private redisLock;
    private isRunning;
    private healthCheckInterval?;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    private registerProcessors;
    private loadActiveBots;
    private startBot;
    private pauseBot;
    private resumeBot;
    private stopBot;
    private cancelAllOrders;
    private startHealthChecks;
    getBotEngine(botId: string): BotEngine | undefined;
    getAllBotEngines(): Map<string, BotEngine>;
}
//# sourceMappingURL=worker.d.ts.map