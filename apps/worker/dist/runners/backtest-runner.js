"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BacktestRunner = void 0;
const db_1 = require("@wallex/db");
const shared_1 = require("@wallex/shared");
const backtester_1 = require("@wallex/backtester");
class BacktestRunner {
    backtester;
    constructor() {
        this.backtester = new backtester_1.CandleBasedBacktester();
    }
    async run(backtestId, config) {
        shared_1.logger.info(`Starting backtest runner for ${backtestId}`);
        try {
            // Update backtest status to RUNNING
            await db_1.prisma.backtest.update({
                where: { id: backtestId },
                data: { status: shared_1.BacktestStatus.RUNNING },
            });
            // Run backtest
            const result = await this.backtester.run(config);
            // Store results
            await this.storeResults(backtestId, result);
            // Update status to COMPLETED
            await db_1.prisma.backtest.update({
                where: { id: backtestId },
                data: {
                    status: shared_1.BacktestStatus.COMPLETED,
                    completedAt: new Date(),
                },
            });
            shared_1.logger.info(`Backtest ${backtestId} completed successfully`);
            return {
                backtestId,
                status: shared_1.BacktestStatus.COMPLETED,
                metrics: result.metrics,
                trades: result.trades,
            };
        }
        catch (error) {
            shared_1.logger.error(`Backtest ${backtestId} failed`, error);
            // Update status to FAILED
            await db_1.prisma.backtest.update({
                where: { id: backtestId },
                data: {
                    status: shared_1.BacktestStatus.FAILED,
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            });
            return {
                backtestId,
                status: shared_1.BacktestStatus.FAILED,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async storeResults(backtestId, result) {
        // Store backtest result
        await db_1.prisma.backtestResult.create({
            data: {
                backtestId,
                totalReturn: result.metrics.totalReturn?.toString() || '0',
                gridProfit: result.metrics.gridProfit?.toString() || '0',
                unrealizedPnl: result.metrics.unrealizedPnl?.toString() || '0',
                totalPnl: result.metrics.totalPnl?.toString() || '0',
                feesPaid: result.metrics.feesPaid?.toString() || '0',
                numberOfBuys: result.metrics.numberOfBuys || 0,
                numberOfSells: result.metrics.numberOfSells || 0,
                winRate: result.metrics.winRate || 0,
                maxDrawdown: result.metrics.maxDrawdown?.toString() || '0',
                sharpeRatio: result.metrics.sharpeRatio?.toString() || '0',
                sortinoRatio: result.metrics.sortinoRatio?.toString() || '0',
                finalBalances: result.metrics.finalBalances,
                equityCurve: result.metrics.equityCurve,
            },
        });
        // Store individual trades
        if (result.trades && result.trades.length > 0) {
            const tradeData = result.trades.map((trade) => ({
                backtestId,
                timestamp: new Date(trade.timestamp),
                side: trade.side,
                price: trade.price.toString(),
                quantity: trade.quantity.toString(),
                fee: trade.fee?.toString() || '0',
                pnl: trade.pnl?.toString() || '0',
            }));
            await db_1.prisma.backtestTrade.createMany({
                data: tradeData,
            });
        }
    }
}
exports.BacktestRunner = BacktestRunner;
//# sourceMappingURL=backtest-runner.js.map