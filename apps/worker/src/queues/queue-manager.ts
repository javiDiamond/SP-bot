import { Queue, Worker, Job } from 'bullmq';
import { logger } from '@wallex/shared';
import Redis from 'ioredis';

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

export class QueueManager {
  private connection: Redis;
  private botCommandQueue?: Queue<BotCommandJob>;
  private backtestQueue?: Queue<BacktestJob>;
  private reconciliationQueue?: Queue<ReconciliationJob>;
  private marketDataSyncQueue?: Queue<MarketDataSyncJob>;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.connection = new Redis(redisUrl);
  }

  async initialize(): Promise<void> {
    // Bot commands queue
    this.botCommandQueue = new Queue<BotCommandJob>('bot-commands', {
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
    this.backtestQueue = new Queue<BacktestJob>('backtests', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 1,
      },
    });

    // Reconciliation queue
    this.reconciliationQueue = new Queue<ReconciliationJob>('reconciliation', {
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
    this.marketDataSyncQueue = new Queue<MarketDataSyncJob>('market-data-sync', {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
      },
    });

    logger.info('Queue manager initialized');
  }

  registerBotCommandProcessor(
    processor: (job: Job<BotCommandJob>) => Promise<void>
  ): void {
    if (!this.botCommandQueue) {
      throw new Error('Queue not initialized');
    }

    const worker = new Worker<BotCommandJob>(
      'bot-commands',
      processor,
      { connection: this.connection }
    );

    worker.on('error', (error) => {
      logger.error('Bot command worker error', error);
    });

    logger.info('Bot command processor registered');
  }

  registerBacktestProcessor(
    processor: (job: Job<BacktestJob>) => Promise<any>
  ): void {
    if (!this.backtestQueue) {
      throw new Error('Queue not initialized');
    }

    const worker = new Worker<BacktestJob>(
      'backtests',
      processor,
      { connection: this.connection }
    );

    worker.on('error', (error) => {
      logger.error('Backtest worker error', error);
    });

    logger.info('Backtest processor registered');
  }

  registerReconciliationProcessor(
    processor: (job: Job<ReconciliationJob>) => Promise<void>
  ): void {
    if (!this.reconciliationQueue) {
      throw new Error('Queue not initialized');
    }

    const worker = new Worker<ReconciliationJob>(
      'reconciliation',
      processor,
      { connection: this.connection }
    );

    worker.on('error', (error) => {
      logger.error('Reconciliation worker error', error);
    });

    logger.info('Reconciliation processor registered');
  }

  registerMarketDataSyncProcessor(
    processor: (job: Job<MarketDataSyncJob>) => Promise<void>
  ): void {
    if (!this.marketDataSyncQueue) {
      throw new Error('Queue not initialized');
    }

    const worker = new Worker<MarketDataSyncJob>(
      'market-data-sync',
      processor,
      { connection: this.connection }
    );

    worker.on('error', (error) => {
      logger.error('Market data sync worker error', error);
    });

    logger.info('Market data sync processor registered');
  }

  async addBotCommand(job: BotCommandJob): Promise<void> {
    if (!this.botCommandQueue) {
      throw new Error('Queue not initialized');
    }

    await this.botCommandQueue.add('bot-command', job);
    logger.debug(`Added bot command: ${job.command} for ${job.botId}`);
  }

  async addBacktest(job: BacktestJob): Promise<string> {
    if (!this.backtestQueue) {
      throw new Error('Queue not initialized');
    }

    const jobInstance = await this.backtestQueue.add('backtest', job);
    logger.debug(`Added backtest: ${job.backtestId}`);
    return jobInstance.id;
  }

  async addReconciliation(job: ReconciliationJob): Promise<void> {
    if (!this.reconciliationQueue) {
      throw new Error('Queue not initialized');
    }

    await this.reconciliationQueue.add('reconciliation', job);
    logger.debug(`Added reconciliation job for ${job.botId || 'all bots'}`);
  }

  async addMarketDataSync(symbol: string): Promise<void> {
    if (!this.marketDataSyncQueue) {
      throw new Error('Queue not initialized');
    }

    await this.marketDataSyncQueue.add('market-data-sync', { symbol });
  }

  async close(): Promise<void> {
    await this.botCommandQueue?.close();
    await this.backtestQueue?.close();
    await this.reconciliationQueue?.close();
    await this.marketDataSyncQueue?.close();
    await this.connection.quit();

    logger.info('Queue manager closed');
  }
}
