"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueManager = void 0;
const bullmq_1 = require("bullmq");
const shared_1 = require("@wallex/shared");
const ioredis_1 = __importDefault(require("ioredis"));
class QueueManager {
    connection;
    botCommandQueue;
    backtestQueue;
    reconciliationQueue;
    marketDataSyncQueue;
    constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.connection = new ioredis_1.default(redisUrl);
    }
    async initialize() {
        // Bot commands queue
        this.botCommandQueue = new bullmq_1.Queue('bot-commands', {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
            },
        });
        // Backtest queue
        this.backtestQueue = new bullmq_1.Queue('backtests', {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 1,
            },
        });
        // Reconciliation queue
        this.reconciliationQueue = new bullmq_1.Queue('reconciliation', {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'fixed',
                    delay: 5000,
                },
            },
        });
        // Market data sync queue
        this.marketDataSyncQueue = new bullmq_1.Queue('market-data-sync', {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 3,
            },
        });
        shared_1.logger.info('Queue manager initialized');
    }
    registerBotCommandProcessor(processor) {
        if (!this.botCommandQueue) {
            throw new Error('Queue not initialized');
        }
        const worker = new bullmq_1.Worker('bot-commands', processor, { connection: this.connection });
        worker.on('error', (error) => {
            shared_1.logger.error('Bot command worker error', error);
        });
        shared_1.logger.info('Bot command processor registered');
    }
    registerBacktestProcessor(processor) {
        if (!this.backtestQueue) {
            throw new Error('Queue not initialized');
        }
        const worker = new bullmq_1.Worker('backtests', processor, { connection: this.connection });
        worker.on('error', (error) => {
            shared_1.logger.error('Backtest worker error', error);
        });
        shared_1.logger.info('Backtest processor registered');
    }
    registerReconciliationProcessor(processor) {
        if (!this.reconciliationQueue) {
            throw new Error('Queue not initialized');
        }
        const worker = new bullmq_1.Worker('reconciliation', processor, { connection: this.connection });
        worker.on('error', (error) => {
            shared_1.logger.error('Reconciliation worker error', error);
        });
        shared_1.logger.info('Reconciliation processor registered');
    }
    registerMarketDataSyncProcessor(processor) {
        if (!this.marketDataSyncQueue) {
            throw new Error('Queue not initialized');
        }
        const worker = new bullmq_1.Worker('market-data-sync', processor, { connection: this.connection });
        worker.on('error', (error) => {
            shared_1.logger.error('Market data sync worker error', error);
        });
        shared_1.logger.info('Market data sync processor registered');
    }
    async addBotCommand(job) {
        if (!this.botCommandQueue) {
            throw new Error('Queue not initialized');
        }
        await this.botCommandQueue.add('bot-command', job);
        shared_1.logger.debug(`Added bot command: ${job.command} for ${job.botId}`);
    }
    async addBacktest(job) {
        if (!this.backtestQueue) {
            throw new Error('Queue not initialized');
        }
        const jobInstance = await this.backtestQueue.add('backtest', job);
        shared_1.logger.debug(`Added backtest: ${job.backtestId}`);
        return jobInstance.id;
    }
    async addReconciliation(job) {
        if (!this.reconciliationQueue) {
            throw new Error('Queue not initialized');
        }
        await this.reconciliationQueue.add('reconciliation', job);
        shared_1.logger.debug(`Added reconciliation job for ${job.botId || 'all bots'}`);
    }
    async addMarketDataSync(symbol) {
        if (!this.marketDataSyncQueue) {
            throw new Error('Queue not initialized');
        }
        await this.marketDataSyncQueue.add('market-data-sync', { symbol });
    }
    async close() {
        await this.botCommandQueue?.close();
        await this.backtestQueue?.close();
        await this.reconciliationQueue?.close();
        await this.marketDataSyncQueue?.close();
        await this.connection.quit();
        shared_1.logger.info('Queue manager closed');
    }
}
exports.QueueManager = QueueManager;
//# sourceMappingURL=queue-manager.js.map