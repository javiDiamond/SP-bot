import { prisma } from '@wallex/db';
import { logger } from '@wallex/shared';

export class ReconciliationService {
  private reconciliationInterval?: NodeJS.Timeout;

  async start(): Promise<void> {
    // Run reconciliation every 30 seconds for all active bots
    const intervalMs = 30000;
    
    this.reconciliationInterval = setInterval(async () => {
      try {
        await this.reconcileAll();
      } catch (error) {
        logger.error('Reconciliation service error', error);
      }
    }, intervalMs);

    logger.info('Reconciliation service started');
  }

  async stop(): Promise<void> {
    if (this.reconciliationInterval) {
      clearInterval(this.reconciliationInterval);
    }
    logger.info('Reconciliation service stopped');
  }

  async reconcileBot(botId: string): Promise<void> {
    logger.info(`Starting reconciliation for bot ${botId}`);

    try {
      const bot = await prisma.bot.findUnique({
        where: { id: botId },
        include: {
          exchangeAccount: true,
          gridConfig: true,
        },
      });

      if (!bot) {
        logger.warn(`Bot ${botId} not found`);
        return;
      }

      if (bot.status === 'STOPPED' || bot.status === 'ERROR') {
        logger.debug(`Skipping reconciliation for bot ${botId} (status: ${bot.status})`);
        return;
      }

      // Get open orders from exchange
      // Note: This would use the exchange adapter
      // For now, we'll just log the action
      logger.info(`Reconciled bot ${botId}`);
    } catch (error) {
      logger.error(`Failed to reconcile bot ${botId}`, error);
      throw error;
    }
  }

  async reconcileAll(): Promise<void> {
    try {
      const activeBots = await prisma.bot.findMany({
        where: {
          status: {
            in: ['RUNNING', 'PAUSED'],
          },
          enabled: true,
        },
      });

      logger.debug(`Reconciling ${activeBots.length} active bots`);

      for (const bot of activeBots) {
        try {
          await this.reconcileBot(bot.id);
        } catch (error) {
          logger.error(`Failed to reconcile bot ${bot.id}`, error);
        }
      }
    } catch (error) {
      logger.error('Failed to reconcile all bots', error);
      throw error;
    }
  }
}
