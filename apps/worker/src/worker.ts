import { prisma } from '@wallex/db';
import { logger, TradingMode, BotStatus, OrderStatus } from '@wallex/shared';
import { BotEngine } from './engines/bot-engine';
import { BacktestRunner } from './runners/backtest-runner';
import { ReconciliationService } from './services/reconciliation';
import { MarketDataService } from './services/market-data';
import { QueueManager } from './queues/queue-manager';
import { RedisLock } from './utils/redis-lock';
import { EventEmitter } from 'events';

export class Worker extends EventEmitter {
  private botEngines: Map<string, BotEngine> = new Map();
  private queueManager: QueueManager;
  private reconciliationService: ReconciliationService;
  private marketDataService: MarketDataService;
  private backtestRunner: BacktestRunner;
  private redisLock: RedisLock;
  private isRunning = false;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.queueManager = new QueueManager();
    this.reconciliationService = new ReconciliationService();
    this.marketDataService = new MarketDataService();
    this.backtestRunner = new BacktestRunner();
    this.redisLock = new RedisLock();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Worker is already running');
      return;
    }

    try {
      // Connect to database
      await prisma.$connect();
      logger.info('Database connected');

      // Initialize queue manager
      await this.queueManager.initialize();
      logger.info('Queue manager initialized');

      // Start market data service
      await this.marketDataService.start();
      logger.info('Market data service started');

      // Register queue processors
      this.registerProcessors();

      // Load and resume active bots
      await this.loadActiveBots();

      // Start reconciliation service
      await this.reconciliationService.start();
      logger.info('Reconciliation service started');

      // Start health checks
      this.startHealthChecks();

      this.isRunning = true;
      logger.info('Worker started successfully');
      
      this.emit('started');
    } catch (error) {
      logger.error('Failed to start worker', error);
      await this.stop();
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping worker...');

    // Stop health checks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Stop all bot engines
    const stopPromises: Promise<void>[] = [];
    for (const [botId, engine] of this.botEngines.entries()) {
      stopPromises.push(
        engine.stop().catch((error) => {
          logger.error(`Error stopping bot ${botId}`, error);
        })
      );
    }
    await Promise.all(stopPromises);
    this.botEngines.clear();

    // Stop services
    await this.reconciliationService.stop();
    await this.marketDataService.stop();
    await this.queueManager.close();

    // Disconnect database
    await prisma.$disconnect();

    this.isRunning = false;
    logger.info('Worker stopped');
    
    this.emit('stopped');
  }

  private registerProcessors(): void {
    // Bot command processor
    this.queueManager.registerBotCommandProcessor(async (job) => {
      const { botId, command } = job.data;
      logger.info(`Processing bot command: ${command} for bot ${botId}`);

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
          logger.warn(`Unknown bot command: ${command}`);
      }
    });

    // Backtest runner processor
    this.queueManager.registerBacktestProcessor(async (job) => {
      const { backtestId, config } = job.data;
      logger.info(`Running backtest: ${backtestId}`);

      try {
        const result = await this.backtestRunner.run(backtestId, config);
        logger.info(`Backtest completed: ${backtestId}`, { result });
        return result;
      } catch (error) {
        logger.error(`Backtest failed: ${backtestId}`, error);
        throw error;
      }
    });

    // Reconciliation processor
    this.queueManager.registerReconciliationProcessor(async (job) => {
      const { botId } = job.data;
      if (botId) {
        await this.reconciliationService.reconcileBot(botId);
      } else {
        await this.reconciliationService.reconcileAll();
      }
    });

    // Market data sync processor
    this.queueManager.registerMarketDataSyncProcessor(async (job) => {
      const { symbol } = job.data;
      await this.marketDataService.syncMarketData(symbol);
    });
  }

  private async loadActiveBots(): Promise<void> {
    try {
      const activeBots = await prisma.bot.findMany({
        where: {
          status: {
            in: [BotStatus.RUNNING, BotStatus.STARTING],
          },
          enabled: true,
        },
        include: {
          gridConfig: true,
          exchangeAccount: true,
        },
      });

      logger.info(`Loading ${activeBots.length} active bots`);

      for (const bot of activeBots) {
        try {
          await this.startBot(bot.id);
        } catch (error) {
          logger.error(`Failed to load bot ${bot.id}`, error);
          // Update bot status to error
          await prisma.bot.update({
            where: { id: bot.id },
            data: {
              status: BotStatus.ERROR,
              lastError: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }
    } catch (error) {
      logger.error('Failed to load active bots', error);
    }
  }

  private async startBot(botId: string): Promise<void> {
    // Check if already running
    if (this.botEngines.has(botId)) {
      logger.warn(`Bot ${botId} is already running`);
      return;
    }

    // Acquire lock
    const lockKey = `bot:${botId}:engine`;
    const lock = await this.redisLock.acquire(lockKey, 30000); // 30 seconds
    if (!lock) {
      logger.warn(`Could not acquire lock for bot ${botId}, skipping`);
      return;
    }

    try {
      // Load bot data
      const bot = await prisma.bot.findUnique({
        where: { id: botId },
        include: {
          gridConfig: true,
          exchangeAccount: true,
        },
      });

      if (!bot) {
        logger.error(`Bot ${botId} not found`);
        await this.redisLock.release(lock);
        return;
      }

      // Validate trading mode
      const isLiveTradingEnabled = process.env.ENABLE_LIVE_TRADING === 'true';
      if (bot.mode === TradingMode.LIVE && !isLiveTradingEnabled) {
        throw new Error(
          'Live trading is disabled. Set ENABLE_LIVE_TRADING=true to enable.'
        );
      }

      // Create bot engine
      const engine = new BotEngine(bot, bot.gridConfig!, bot.exchangeAccount!);
      
      // Handle engine events
      engine.on('order_placed', (order) => {
        this.emit('order_placed', order);
      });
      engine.on('order_filled', (fill) => {
        this.emit('order_filled', fill);
      });
      engine.on('error', (error) => {
        logger.error(`Bot engine error: ${botId}`, error);
        this.emit('bot_error', { botId, error });
      });
      engine.on('status_change', (status) => {
        this.emit('bot_status_change', { botId, status });
      });

      // Start engine
      await engine.start();
      
      this.botEngines.set(botId, engine);
      logger.info(`Bot ${botId} started successfully`);
    } catch (error) {
      logger.error(`Failed to start bot ${botId}`, error);
      await this.redisLock.release(lock);
      throw error;
    }

    // Release lock (engine holds its own lock while running)
    await this.redisLock.release(lock);
  }

  private async pauseBot(botId: string): Promise<void> {
    const engine = this.botEngines.get(botId);
    if (!engine) {
      logger.warn(`Bot ${botId} not running, cannot pause`);
      return;
    }

    await engine.pause();
    logger.info(`Bot ${botId} paused`);
  }

  private async resumeBot(botId: string): Promise<void> {
    const engine = this.botEngines.get(botId);
    if (!engine) {
      logger.warn(`Bot ${botId} not running, cannot resume`);
      return;
    }

    await engine.resume();
    logger.info(`Bot ${botId} resumed`);
  }

  private async stopBot(botId: string): Promise<void> {
    const engine = this.botEngines.get(botId);
    if (!engine) {
      logger.warn(`Bot ${botId} not running, cannot stop`);
      return;
    }

    await engine.stop();
    this.botEngines.delete(botId);
    logger.info(`Bot ${botId} stopped`);
  }

  private async cancelAllOrders(botId: string): Promise<void> {
    const engine = this.botEngines.get(botId);
    if (!engine) {
      logger.warn(`Bot ${botId} not running, cannot cancel orders`);
      return;
    }

    await engine.cancelAllOrders();
    logger.info(`All orders cancelled for bot ${botId}`);
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;
        
        // Check bot engines
        for (const [botId, engine] of this.botEngines.entries()) {
          if (!engine.isHealthy()) {
            logger.warn(`Bot ${botId} is unhealthy`);
          }
        }

        logger.debug('Health check passed');
      } catch (error) {
        logger.error('Health check failed', error);
      }
    }, 30000); // Every 30 seconds
  }

  getBotEngine(botId: string): BotEngine | undefined {
    return this.botEngines.get(botId);
  }

  getAllBotEngines(): Map<string, BotEngine> {
    return new Map(this.botEngines);
  }
}
