/**
 * Reconciliation Service
 *
 * Periodic + on-demand reconciliation of running bots. Delegates to each
 * BotEngine.reconcile(), which compares exchange open orders vs DB orders
 * by exact clientOrderId (orphans are never canceled).
 */

import { prisma } from '@wallex/db';
import { logger } from '@wallex/shared';
import type { BotEngine } from '../engines/bot-engine';
import { workerConfig } from '../config';

export class ReconciliationService {
  private timer?: NodeJS.Timeout;

  constructor(private getEngine: (botId: string) => BotEngine | undefined) {}

  start(): void {
    this.timer = setInterval(() => {
      this.reconcileAll().catch(err => {
        logger.warn(`Periodic reconciliation failed: ${String((err as Error)?.message || err)}`);
      });
    }, workerConfig.reconcileIntervalMs);
    logger.info(`Reconciliation service started (every ${workerConfig.reconcileIntervalMs / 60000} min)`);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  async reconcileBot(botId: string): Promise<void> {
    const engine = this.getEngine(botId);
    if (engine && engine.isRunningEngine()) {
      await engine.reconcile();
      return;
    }
    logger.debug(`Skipping reconciliation for bot ${botId} (no running engine)`);
  }

  async reconcileAll(): Promise<void> {
    const bots = await prisma.bot.findMany({
      where: { status: { in: ['RUNNING', 'STARTING', 'PAUSED'] } },
      select: { id: true },
    });
    for (const bot of bots) {
      try {
        await this.reconcileBot(bot.id);
      } catch (err) {
        logger.warn(`Reconciliation failed for bot ${bot.id}: ${String((err as Error)?.message || err)}`);
      }
    }
  }
}
