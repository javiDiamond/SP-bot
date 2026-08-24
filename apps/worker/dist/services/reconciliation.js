"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationService = void 0;
const db_1 = require("@wallex/db");
const shared_1 = require("@wallex/shared");
class ReconciliationService {
    reconciliationInterval;
    async start() {
        // Run reconciliation every 30 seconds for all active bots
        const intervalMs = 30000;
        this.reconciliationInterval = setInterval(async () => {
            try {
                await this.reconcileAll();
            }
            catch (error) {
                shared_1.logger.error('Reconciliation service error', error);
            }
        }, intervalMs);
        shared_1.logger.info('Reconciliation service started');
    }
    async stop() {
        if (this.reconciliationInterval) {
            clearInterval(this.reconciliationInterval);
        }
        shared_1.logger.info('Reconciliation service stopped');
    }
    async reconcileBot(botId) {
        shared_1.logger.info(`Starting reconciliation for bot ${botId}`);
        try {
            const bot = await db_1.prisma.bot.findUnique({
                where: { id: botId },
                include: {
                    exchangeAccount: true,
                    gridConfig: true,
                },
            });
            if (!bot) {
                shared_1.logger.warn(`Bot ${botId} not found`);
                return;
            }
            if (bot.status === 'STOPPED' || bot.status === 'ERROR') {
                shared_1.logger.debug(`Skipping reconciliation for bot ${botId} (status: ${bot.status})`);
                return;
            }
            // Get open orders from exchange
            // Note: This would use the exchange adapter
            // For now, we'll just log the action
            shared_1.logger.info(`Reconciled bot ${botId}`);
        }
        catch (error) {
            shared_1.logger.error(`Failed to reconcile bot ${botId}`, error);
            throw error;
        }
    }
    async reconcileAll() {
        try {
            const activeBots = await db_1.prisma.bot.findMany({
                where: {
                    status: {
                        in: ['RUNNING', 'PAUSED'],
                    },
                    enabled: true,
                },
            });
            shared_1.logger.debug(`Reconciling ${activeBots.length} active bots`);
            for (const bot of activeBots) {
                try {
                    await this.reconcileBot(bot.id);
                }
                catch (error) {
                    shared_1.logger.error(`Failed to reconcile bot ${bot.id}`, error);
                }
            }
        }
        catch (error) {
            shared_1.logger.error('Failed to reconcile all bots', error);
            throw error;
        }
    }
}
exports.ReconciliationService = ReconciliationService;
//# sourceMappingURL=reconciliation.js.map