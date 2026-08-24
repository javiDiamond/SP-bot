"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
const db_1 = require("@wallex/db");
const shared_1 = require("@wallex/shared");
const bot_engine_1 = require("./engines/bot-engine");
const backtest_runner_1 = require("./runners/backtest-runner");
const reconciliation_1 = require("./services/reconciliation");
const market_data_1 = require("./services/market-data");
const queue_manager_1 = require("./queues/queue-manager");
const redis_lock_1 = require("./utils/redis-lock");
const events_1 = require("events");
class Worker extends events_1.EventEmitter {
    botEngines = new Map();
    queueManager;
    reconciliationService;
    marketDataService;
    backtestRunner;
    redisLock;
    isRunning = false;
    healthCheckInterval;
    constructor() {
        super();
        this.queueManager = new queue_manager_1.QueueManager();
        this.reconciliationService = new reconciliation_1.ReconciliationService();
        this.marketDataService = new market_data_1.MarketDataService();
        this.backtestRunner = new backtest_runner_1.BacktestRunner();
        this.redisLock = new redis_lock_1.RedisLock();
    }
    async start() {
        if (this.isRunning) {
            shared_1.logger.warn('Worker is already running');
            return;
        }
        try {
            // Connect to database
            await db_1.prisma.$connect();
            shared_1.logger.info('Database connected');
            // Initialize queue manager
            await this.queueManager.initialize();
            shared_1.logger.info('Queue manager initialized');
            // Start market data service
            await this.marketDataService.start();
            shared_1.logger.info('Market data service started');
            // Register queue processors
            this.registerProcessors();
            // Load and resume active bots
            await this.loadActiveBots();
            // Start reconciliation service
            await this.reconciliationService.start();
            shared_1.logger.info('Reconciliation service started');
            // Start health checks
            this.startHealthChecks();
            this.isRunning = true;
            shared_1.logger.info('Worker started successfully');
            this.emit('started');
        }
        catch (error) {
            shared_1.logger.error('Failed to start worker', error);
            await this.stop();
            throw error;
        }
    }
    async stop() {
        if (!this.isRunning) {
            return;
        }
        shared_1.logger.info('Stopping worker...');
        // Stop health checks
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        // Stop all bot engines
        const stopPromises = [];
        for (const [botId, engine] of this.botEngines.entries()) {
            stopPromises.push(engine.stop().catch((error) => {
                shared_1.logger.error(`Error stopping bot ${botId}`, error);
            }));
        }
        await Promise.all(stopPromises);
        this.botEngines.clear();
        // Stop services
        await this.reconciliationService.stop();
        await this.marketDataService.stop();
        await this.queueManager.close();
        // Disconnect database
        await db_1.prisma.$disconnect();
        this.isRunning = false;
        shared_1.logger.info('Worker stopped');
        this.emit('stopped');
    }
    registerProcessors() {
        // Bot command processor
        this.queueManager.registerBotCommandProcessor(async (job) => {
            const { botId, command } = job.data;
            shared_1.logger.info(`Processing bot command: ${command} for bot ${botId}`);
            switch (command) {
                case 'START':
                    await this.startBot(botId);
                    break;
                case 'PAUSE':
                    await this.pauseBot(botId);
                    break;
                case 'RESUME':
                    await this.resumeBot(botId);
                    break;
                case 'STOP':
                    await this.stopBot(botId);
                    break;
                case 'CANCEL_ALL':
                    await this.cancelAllOrders(botId);
                    break;
                default:
                    shared_1.logger.warn(`Unknown bot command: ${command}`);
            }
        });
        // Backtest runner processor
        this.queueManager.registerBacktestProcessor(async (job) => {
            const { backtestId, config } = job.data;
            shared_1.logger.info(`Running backtest: ${backtestId}`);
            try {
                const result = await this.backtestRunner.run(backtestId, config);
                shared_1.logger.info(`Backtest completed: ${backtestId}`, { result });
                return result;
            }
            catch (error) {
                shared_1.logger.error(`Backtest failed: ${backtestId}`, error);
                throw error;
            }
        });
        // Reconciliation processor
        this.queueManager.registerReconciliationProcessor(async (job) => {
            const { botId } = job.data;
            if (botId) {
                await this.reconciliationService.reconcileBot(botId);
            }
            else {
                await this.reconciliationService.reconcileAll();
            }
        });
        // Market data sync processor
        this.queueManager.registerMarketDataSyncProcessor(async (job) => {
            const { symbol } = job.data;
            await this.marketDataService.syncMarketData(symbol);
        });
    }
    async loadActiveBots() {
        try {
            const activeBots = await db_1.prisma.bot.findMany({
                where: {
                    status: {
                        in: [shared_1.BotStatus.RUNNING, shared_1.BotStatus.STARTING],
                    },
                    enabled: true,
                },
                include: {
                    gridConfig: true,
                    exchangeAccount: true,
                },
            });
            shared_1.logger.info(`Loading ${activeBots.length} active bots`);
            for (const bot of activeBots) {
                try {
                    await this.startBot(bot.id);
                }
                catch (error) {
                    shared_1.logger.error(`Failed to load bot ${bot.id}`, error);
                    // Update bot status to error
                    await db_1.prisma.bot.update({
                        where: { id: bot.id },
                        data: {
                            status: shared_1.BotStatus.ERROR,
                            lastError: error instanceof Error ? error.message : 'Unknown error',
                        },
                    });
                }
            }
        }
        catch (error) {
            shared_1.logger.error('Failed to load active bots', error);
        }
    }
    async startBot(botId) {
        // Check if already running
        if (this.botEngines.has(botId)) {
            shared_1.logger.warn(`Bot ${botId} is already running`);
            return;
        }
        // Acquire lock
        const lockKey = `bot:${botId}:engine`;
        const lock = await this.redisLock.acquire(lockKey, 30000); // 30 seconds
        if (!lock) {
            shared_1.logger.warn(`Could not acquire lock for bot ${botId}, skipping`);
            return;
        }
        try {
            // Load bot data
            const bot = await db_1.prisma.bot.findUnique({
                where: { id: botId },
                include: {
                    gridConfig: true,
                    exchangeAccount: true,
                },
            });
            if (!bot) {
                shared_1.logger.error(`Bot ${botId} not found`);
                await this.redisLock.release(lock);
                return;
            }
            // Validate trading mode
            const isLiveTradingEnabled = process.env.ENABLE_LIVE_TRADING === 'true';
            if (bot.mode === shared_1.TradingMode.LIVE && !isLiveTradingEnabled) {
                throw new Error('Live trading is disabled. Set ENABLE_LIVE_TRADING=true to enable.');
            }
            // Create bot engine
            const engine = new bot_engine_1.BotEngine(bot, bot.gridConfig, bot.exchangeAccount);
            // Handle engine events
            engine.on('order_placed', (order) => {
                this.emit('order_placed', order);
            });
            engine.on('order_filled', (fill) => {
                this.emit('order_filled', fill);
            });
            engine.on('error', (error) => {
                shared_1.logger.error(`Bot engine error: ${botId}`, error);
                this.emit('bot_error', { botId, error });
            });
            engine.on('status_change', (status) => {
                this.emit('bot_status_change', { botId, status });
            });
            // Start engine
            await engine.start();
            this.botEngines.set(botId, engine);
            shared_1.logger.info(`Bot ${botId} started successfully`);
        }
        catch (error) {
            shared_1.logger.error(`Failed to start bot ${botId}`, error);
            await this.redisLock.release(lock);
            throw error;
        }
        // Release lock (engine holds its own lock while running)
        await this.redisLock.release(lock);
    }
    async pauseBot(botId) {
        const engine = this.botEngines.get(botId);
        if (!engine) {
            shared_1.logger.warn(`Bot ${botId} not running, cannot pause`);
            return;
        }
        await engine.pause();
        shared_1.logger.info(`Bot ${botId} paused`);
    }
    async resumeBot(botId) {
        const engine = this.botEngines.get(botId);
        if (!engine) {
            shared_1.logger.warn(`Bot ${botId} not running, cannot resume`);
            return;
        }
        await engine.resume();
        shared_1.logger.info(`Bot ${botId} resumed`);
    }
    async stopBot(botId) {
        const engine = this.botEngines.get(botId);
        if (!engine) {
            shared_1.logger.warn(`Bot ${botId} not running, cannot stop`);
            return;
        }
        await engine.stop();
        this.botEngines.delete(botId);
        shared_1.logger.info(`Bot ${botId} stopped`);
    }
    async cancelAllOrders(botId) {
        const engine = this.botEngines.get(botId);
        if (!engine) {
            shared_1.logger.warn(`Bot ${botId} not running, cannot cancel orders`);
            return;
        }
        await engine.cancelAllOrders();
        shared_1.logger.info(`All orders cancelled for bot ${botId}`);
    }
    startHealthChecks() {
        this.healthCheckInterval = setInterval(async () => {
            try {
                // Check database connection
                await db_1.prisma.$queryRaw `SELECT 1`;
                // Check bot engines
                for (const [botId, engine] of this.botEngines.entries()) {
                    if (!engine.isHealthy()) {
                        shared_1.logger.warn(`Bot ${botId} is unhealthy`);
                    }
                }
                shared_1.logger.debug('Health check passed');
            }
            catch (error) {
                shared_1.logger.error('Health check failed', error);
            }
        }, 30000); // Every 30 seconds
    }
    getBotEngine(botId) {
        return this.botEngines.get(botId);
    }
    getAllBotEngines() {
        return new Map(this.botEngines);
    }
}
exports.Worker = Worker;
//# sourceMappingURL=worker.js.map