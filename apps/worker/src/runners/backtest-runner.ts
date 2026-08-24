import { prisma, Backtest } from '@wallex/db';
import { logger, BacktestStatus } from '@wallex/shared';
import { CandleBasedBacktester } from '@wallex/backtester';

export interface BacktestResult {
  backtestId: string;
  status: BacktestStatus;
  metrics?: any;
  trades?: any[];
  error?: string;
}

export class BacktestRunner {
  private backtester: CandleBasedBacktester;

  constructor() {
    this.backtester = new CandleBasedBacktester();
  }

  async run(backtestId: string, config: any): Promise<BacktestResult> {
    logger.info(`Starting backtest runner for ${backtestId}`);

    try {
      // Update backtest status to RUNNING
      await prisma.backtest.update({
        where: { id: backtestId },
        data: { status: BacktestStatus.RUNNING },
      });

      // Run backtest
      const result = await this.backtester.run(config);

      // Store results
      await this.storeResults(backtestId, result);

      // Update status to COMPLETED
      await prisma.backtest.update({
        where: { id: backtestId },
        data: { 
          status: BacktestStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      logger.info(`Backtest ${backtestId} completed successfully`);

      return {
        backtestId,
        status: BacktestStatus.COMPLETED,
        metrics: result.metrics,
        trades: result.trades,
      };
    } catch (error) {
      logger.error(`Backtest ${backtestId} failed`, error);

      // Update status to FAILED
      await prisma.backtest.update({
        where: { id: backtestId },
        data: {
          status: BacktestStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return {
        backtestId,
        status: BacktestStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async storeResults(backtestId: string, result: any): Promise<void> {
    // Store backtest result
    await prisma.backtestResult.create({
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
      const tradeData = result.trades.map((trade: any) => ({
        backtestId,
        timestamp: new Date(trade.timestamp),
        side: trade.side,
        price: trade.price.toString(),
        quantity: trade.quantity.toString(),
        fee: trade.fee?.toString() || '0',
        pnl: trade.pnl?.toString() || '0',
      }));

      await prisma.backtestTrade.createMany({
        data: tradeData,
      });
    }
  }
}
