/**
 * Worker orchestrator
 *
 * - Consumes BullMQ queues (bot commands, backtests, reconciliation,
 *   market-data sync, PnL snapshots) with shared zod-validated payloads
 * - Owns the per-bot engine registry (BotEngine drivers)
 * - Periodic reconciliation + PnL snapshots
 * - Kill-switch watcher (defense in depth alongside KILL_ALL jobs)
 * - Health endpoint for the compose healthcheck (:4001/health)
 */

import http from 'http';
import { EventEmitter } from 'events';
import { prisma, BotStatus } from '@wallex/db';
import {
  BacktestJob,
  BotCommandJob,
  BotStatus as SharedBotStatus,
  MarketDataSyncJob,
  PnlSnapshotJob,
  QUEUE_NAMES,
  ReconciliationJob,
  logger,
} from '@wallex/shared';
import { BotEngine } from './engines/bot-engine';
import { BacktestRunner } from './runners/backtest-runner';
import { ReconciliationService } from './services/reconciliation';
import { MarketDataSyncService } from './services/market-data-sync';
import { RiskService } from './services/risk';
import { RealtimePublisher } from './services/events';
import { QueueManager } from './queues/queue-manager';
import { RedisLock } from './utils/redis-lock';
import { writeEventLog } from './utils/event-log';
import { workerConfig } from './config';

export class Worker extends EventEmitter {
  private engines = new Map<string, BotEngine>();
  private events: RealtimePublisher;
  private risk: RiskService;
  private lock: RedisLock;
  private queues: QueueManager;
  private marketData: MarketDataSyncService;
  private backtestRunner: BacktestRunner;
  private reconciliation: ReconciliationService;
  private healthServer?: http.Server;
  private pnlTimer?: NodeJS.Timeout;
  private killWatchTimer?: NodeJS.Timeout;
  private killSwitchActive = false;
  private isRunning = false;

  constructor() {
    super();
    this.events = new RealtimePublisher();
    this.risk = new RiskService(this.events);
    this.lock = new RedisLock();
    this.queues = new QueueManager();
    this.marketData = new MarketDataSyncService();
    this.backtestRunner = new BacktestRunner(this.events, this.marketData);
    this.reconciliation = new ReconciliationService(botId => this.engines.get(botId));
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  async start(): Promise<void> {
    if (this.isRunning) return;

    await prisma.$connect();
    logger.info('Database connected');

    this.registerProcessors();
    await this.loadActiveBots();

    this.reconciliation.start();
    this.startPnlSnapshots();
    await this.startKillSwitchWatcher();
    this.startHealthServer();

    this.isRunning = true;
    logger.info('Worker started successfully');
    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    logger.info('Stopping worker...');

    if (this.pnlTimer) clearInterval(this.pnlTimer);
    if (this.killWatchTimer) clearInterval(this.killWatchTimer);
    this.reconciliation.stop();

    // Stop engines without overwriting a meaningful final status
    await Promise.all(
      [...this.engines.values()].map(engine =>
        engine.stop(BotStatus.PAUSED, 'worker shutdown').catch(err => {
          logger.warn(`Error stopping bot ${engine.botId}: ${String((err as Error)?.message || err)}`);
        }),
      ),
    );
    this.engines.clear();

    await this.queues.close();
    await this.lock.close();
    await this.events.close();

    if (this.healthServer) {
      await new Promise<void>(resolve => {
        this.healthServer!.close(() => resolve());
        setTimeout(resolve, 1000).unref();
      });
    }

    await prisma.$disconnect();

    this.isRunning = false;
    logger.info('Worker stopped');
    this.emit('stopped');
  }

  // ==========================================================================
  // Queue processors
  // ==========================================================================

  private registerProcessors(): void {
    this.queues.register<BotCommandJob>(QUEUE_NAMES.botCommands, job => this.handleBotCommand(job));
    this.queues.register<BacktestJob>(QUEUE_NAMES.backtests, job => this.handleBacktestJob(job));
    this.queues.register<ReconciliationJob>(QUEUE_NAMES.reconciliation, job =>
      this.handleReconciliationJob(job),
    );
    this.queues.register<MarketDataSyncJob>(QUEUE_NAMES.marketDataSync, job =>
      this.handleMarketDataSyncJob(job),
    );
    this.queues.register<PnlSnapshotJob>(QUEUE_NAMES.pnlSnapshots, job => this.handlePnlSnapshotJob(job));
  }

  private async handleBotCommand(job: BotCommandJob): Promise<void> {
    const { type, botId } = job;
    logger.info(`Bot command ${type} for bot ${botId}`);

    switch (type) {
      case 'START': {
        const engine = this.getOrCreateEngine(botId);
        await engine.start();
        break;
      }
      case 'PAUSE': {
        const engine = this.engines.get(botId);
        if (engine) {
          await engine.pause();
        } else {
          await prisma.bot
            .updateMany({ where: { id: botId }, data: { status: BotStatus.PAUSED } })
            .catch(() => undefined);
          this.events.publish('bot.status', { botId, status: SharedBotStatus.PAUSED });
        }
        break;
      }
      case 'RESUME': {
        const engine = this.getOrCreateEngine(botId);
        await engine.resume();
        break;
      }
      case 'STOP': {
        const engine = this.engines.get(botId);
        if (engine) {
          this.engines.delete(botId);
          await engine.stop(BotStatus.STOPPED, 'stopped by command');
        } else {
          await prisma.bot
            .updateMany({ where: { id: botId }, data: { status: BotStatus.STOPPED, stoppedAt: new Date() } })
            .catch(() => undefined);
          this.events.publish('bot.status', { botId, status: SharedBotStatus.STOPPED });
        }
        break;
      }
      case 'CANCEL_ALL': {
        const engine = this.engines.get(botId);
        if (engine) {
          await engine.cancelAllOrders();
        } else {
          logger.warn(`CANCEL_ALL for bot ${botId} ignored: no running engine`);
        }
        break;
      }
      case 'KILL_ALL': {
        const engine = this.engines.get(botId);
        if (engine) {
          this.engines.delete(botId);
          await engine.kill();
        } else {
          await prisma.bot
            .updateMany({
              where: { id: botId, status: { in: ['RUNNING', 'STARTING', 'PAUSED', 'PAUSING'] } },
              data: { status: BotStatus.KILLED, stoppedAt: new Date() },
            })
            .catch(() => undefined);
          this.events.publish('bot.status', { botId, status: SharedBotStatus.KILLED, reason: 'kill-switch' });
        }
        break;
      }
      default:
        logger.warn(`Unknown bot command: ${type}`);
    }
  }

  private async handleBacktestJob(job: BacktestJob): Promise<void> {
    if (job.type === 'RUN_BACKTEST' && job.backtestId) {
      await this.backtestRunner.runBacktest(job.backtestId);
    } else if (job.type === 'RUN_OPTIMIZATION' && job.optimizationId) {
      await this.backtestRunner.runOptimization(job.optimizationId);
    } else {
      logger.warn(`Invalid backtest job: ${JSON.stringify(job).slice(0, 200)}`);
    }
  }

  private async handleReconciliationJob(job: ReconciliationJob): Promise<void> {
    if (job.botId) {
      await this.reconciliation.reconcileBot(job.botId);
    } else {
      await this.reconciliation.reconcileAll();
    }
  }

  private async handleMarketDataSyncJob(job: MarketDataSyncJob): Promise<void> {
    if (job.type === 'SYNC_MARKETS') {
      await this.marketData.syncMarkets();
      return;
    }
    if (job.type === 'INGEST_CANDLES') {
      if (!job.symbol || !job.resolution || !job.from || !job.to) {
        logger.warn(`INGEST_CANDLES job missing params: ${JSON.stringify(job).slice(0, 200)}`);
        return;
      }
      await this.marketData.ingestCandles({
        symbol: job.symbol,
        resolution: job.resolution,
        from: job.from,
        to: job.to,
      });
    }
  }

  private async handlePnlSnapshotJob(job: PnlSnapshotJob): Promise<void> {
    if (job.type === 'SNAPSHOT_BOT' && job.botId) {
      const engine = this.engines.get(job.botId);
      if (engine) await engine.snapshotPnl();
      return;
    }
    // SNAPSHOT_ALL
    for (const engine of this.engines.values()) {
      try {
        await engine.snapshotPnl();
      } catch (err) {
        logger.warn(`PnL snapshot failed for bot ${engine.botId}: ${String((err as Error)?.message || err)}`);
      }
    }
  }

  // ==========================================================================
  // Engine registry / startup
  // ==========================================================================

  private getOrCreateEngine(botId: string): BotEngine {
    let engine = this.engines.get(botId);
    if (!engine) {
      engine = new BotEngine(botId, { risk: this.risk, events: this.events, lock: this.lock });
      this.engines.set(botId, engine);
    }
    return engine;
  }

  /**
   * Crash recovery: bots left RUNNING/STARTING are restarted; bots left
   * PAUSED stay paused (user resumes explicitly).
   */
  private async loadActiveBots(): Promise<void> {
    try {
      const bots = await prisma.bot.findMany({
        where: { status: { in: ['RUNNING', 'STARTING', 'PAUSED'] } },
        select: { id: true, status: true },
      });

      logger.info(`Loading ${bots.length} active bots from DB`);

      for (const bot of bots) {
        if (bot.status === 'PAUSED') continue; // stays paused
        try {
          const engine = this.getOrCreateEngine(bot.id);
          await engine.start();
        } catch (err) {
          logger.warn(`Failed to resume bot ${bot.id}: ${String((err as Error)?.message || err)}`);
          // engine.start() already marks ERROR internally; drop the dead engine
          this.engines.delete(bot.id);
        }
      }
    } catch (err) {
      logger.error(`Failed to load active bots: ${String((err as Error)?.message || err)}`);
    }
  }

  // ==========================================================================
  // Kill switch watcher
  // ==========================================================================

  private async startKillSwitchWatcher(): Promise<void> {
    await this.risk.refresh();
    this.killSwitchActive = await this.risk.isKillSwitchActive();

    this.killWatchTimer = setInterval(async () => {
      try {
        const active = await this.risk.isKillSwitchActive();
        if (active && !this.killSwitchActive) {
          logger.warn('Kill switch activated — stopping all engines');
          await writeEventLog({
            level: 'ERROR',
            event: 'killswitch.worker',
            message: 'Worker detected kill switch activation; killing all running bots',
          });
          const ids = [...this.engines.keys()];
          for (const botId of ids) {
            const engine = this.engines.get(botId);
            this.engines.delete(botId);
            if (engine) {
              await engine.kill().catch(err =>
                logger.warn(`Kill failed for bot ${botId}: ${String((err as Error)?.message || err)}`),
              );
            }
          }
          await this.risk.forceKillBots('worker kill watcher');
        }
        this.killSwitchActive = active;
      } catch (err) {
        logger.warn(`Kill switch watcher error: ${String((err as Error)?.message || err)}`);
      }
    }, 5000);
  }

  // ==========================================================================
  // PnL snapshots
  // ==========================================================================

  private startPnlSnapshots(): void {
    this.pnlTimer = setInterval(async () => {
      for (const engine of this.engines.values()) {
        try {
          if (engine.isRunningEngine()) await engine.snapshotPnl();
        } catch (err) {
          logger.warn(`PnL snapshot failed for bot ${engine.botId}: ${String((err as Error)?.message || err)}`);
        }
      }
    }, workerConfig.pnlSnapshotIntervalMs);
  }

  // ==========================================================================
  // Health endpoint
  // ==========================================================================

  private startHealthServer(): void {
    this.healthServer = http.createServer((req, res) => {
      if (req.url === '/health') {
        const runningBots = [...this.engines.values()].filter(e => e.isRunningEngine()).length;
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ok',
            engines: this.engines.size,
            runningBots,
            uptimeSeconds: Math.round(process.uptime()),
            timestamp: Date.now(),
          }),
        );
        return;
      }
      res.writeHead(404);
      res.end();
    });

    this.healthServer.on('error', err => {
      logger.warn(`Health server error: ${String(err?.message || err)}`);
    });

    this.healthServer.listen(workerConfig.healthPort, () => {
      logger.info(`Worker health endpoint listening on :${workerConfig.healthPort}/health`);
    });
  }

  getEngine(botId: string): BotEngine | undefined {
    return this.engines.get(botId);
  }
}
