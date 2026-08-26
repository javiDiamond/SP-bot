/**
 * Backtest Runner
 *
 * Executes RUN_BACKTEST and RUN_OPTIMIZATION jobs:
 * - loads the Backtest/OptimizationJob row, marks RUNNING
 * - loads candles from DB (auto-ingesting from Wallex when missing)
 * - drives the shared GridEngine via CandleBasedBacktester (D6 single engine)
 * - persists results Json + BacktestTrade rows + status + completedAt
 * - emits backtest.progress realtime events
 */

import {
  prisma,
  BacktestStatus,
  OptimizationStatus,
} from '@wallex/db';
import {
  Candle,
  GridConfig,
  GridConfigSchema,
  MarketInfo,
  logger,
} from '@wallex/shared';
import { CandleBasedBacktester, BacktestResult } from '@wallex/backtester';
import Decimal from 'decimal.js';
import { MarketDataSyncService } from '../services/market-data-sync';
import { RealtimePublisher } from '../services/events';

const MAX_EQUITY_POINTS = 1500;

interface StoredBacktestConfig {
  name?: string;
  symbol: string;
  dateFrom: string;
  dateTo: string;
  resolution: string;
  config: GridConfig;
  initialBalances?: Record<string, string>;
  feeOverrides?: { makerFeeRate?: string; takerFeeRate?: string };
  slippageBps?: number;
  sameCandlePolicy?: 'conservative' | 'aggressive';
  volumeFillCapRatio?: number;
}

interface RangeSpec {
  param?: string;
  from?: number;
  to?: number;
  step?: number;
  values?: Array<number | string>;
}

export class BacktestRunner {
  constructor(
    private events: RealtimePublisher,
    private marketData: MarketDataSyncService,
  ) {}

  // ==========================================================================
  // Single backtest
  // ==========================================================================

  async runBacktest(backtestId: string): Promise<void> {
    const row = await prisma.backtest.findUnique({ where: { id: backtestId } });
    if (!row) {
      logger.warn(`Backtest ${backtestId} not found`);
      return;
    }

    this.progress(backtestId, 'RUNNING', 0);
    await prisma.backtest.update({
      where: { id: backtestId },
      data: { status: BacktestStatus.RUNNING },
    });

    try {
      const cfg = this.parseConfig(row.config);
      const result = await this.execute(cfg, `bt_${backtestId.slice(0, 8)}`);

      if (!result.success) {
        await prisma.backtest.update({
          where: { id: backtestId },
          data: {
            status: BacktestStatus.FAILED,
            error: result.error || 'Backtest failed',
            completedAt: new Date(),
          },
        });
        this.progress(backtestId, 'FAILED', 100);
        return;
      }

      await this.persistResults(backtestId, result);
      await prisma.backtest.update({
        where: { id: backtestId },
        data: { status: BacktestStatus.COMPLETED, completedAt: new Date() },
      });
      this.progress(backtestId, 'COMPLETED', 100);
      logger.info(`Backtest ${backtestId} completed (${result.trades.length} trades)`);
    } catch (err) {
      const message = String((err as Error)?.message || err);
      logger.error(`Backtest ${backtestId} failed: ${message}`);
      await prisma.backtest
        .update({
          where: { id: backtestId },
          data: { status: BacktestStatus.FAILED, error: message.slice(0, 2000), completedAt: new Date() },
        })
        .catch(() => undefined);
      this.progress(backtestId, 'FAILED', 100);
    }
  }

  /** Core execution shared by single backtests and optimization combos. */
  private async execute(cfg: StoredBacktestConfig, botIdSeed: string): Promise<BacktestResult> {
    const symbol = cfg.symbol.toUpperCase();
    const market = await this.marketData.ensureMarket(symbol);
    if (!market) {
      return { success: false, error: `Market ${symbol} not found`, trades: [], equityCurve: [], warnings: [], candlesProcessed: 0 };
    }

    const marketRow = await prisma.market.findUnique({ where: { symbol } });
    if (!marketRow) {
      return { success: false, error: `Market row missing for ${symbol}`, trades: [], equityCurve: [], warnings: [], candlesProcessed: 0 };
    }

    const marketInfo = this.toMarketInfo(marketRow);
    const fromSec = Math.floor(new Date(cfg.dateFrom).getTime() / 1000);
    const toSec = Math.floor(new Date(cfg.dateTo).getTime() / 1000);

    let candles = await this.loadCandles(marketRow.id, cfg.resolution, cfg.dateFrom, cfg.dateTo);
    if (candles.length === 0) {
      logger.info(`No candles in DB for ${symbol} ${cfg.resolution}; ingesting from exchange`);
      await this.marketData.ingestCandles({ symbol, resolution: cfg.resolution, from: fromSec, to: toSec });
      candles = await this.loadCandles(marketRow.id, cfg.resolution, cfg.dateFrom, cfg.dateTo);
    }

    if (candles.length === 0) {
      return {
        success: false,
        error: `No candle data available for ${symbol} ${cfg.resolution} in the selected period`,
        trades: [],
        equityCurve: [],
        warnings: [],
        candlesProcessed: 0,
      };
    }

    const backtester = new CandleBasedBacktester({
      symbol,
      market: marketInfo,
      config: cfg.config,
      candles,
      initialBalances: cfg.initialBalances,
      feeOverrides: cfg.feeOverrides,
      slippageBps: cfg.slippageBps,
      sameCandlePolicy: cfg.sameCandlePolicy,
      volumeFillCapRatio: cfg.volumeFillCapRatio,
      botId: botIdSeed,
    });

    return backtester.run();
  }

  private parseConfig(raw: unknown): StoredBacktestConfig {
    const obj = (raw ?? {}) as Record<string, unknown>;
    const gridConfig = GridConfigSchema.parse(obj.config);
    return {
      name: typeof obj.name === 'string' ? obj.name : undefined,
      symbol: String(obj.symbol ?? ''),
      dateFrom: String(obj.dateFrom ?? ''),
      dateTo: String(obj.dateTo ?? ''),
      resolution: String(obj.resolution ?? '1h'),
      config: gridConfig,
      initialBalances: obj.initialBalances as Record<string, string> | undefined,
      feeOverrides: obj.feeOverrides as StoredBacktestConfig['feeOverrides'],
      slippageBps: typeof obj.slippageBps === 'number' ? obj.slippageBps : undefined,
      sameCandlePolicy: (obj.sameCandlePolicy as StoredBacktestConfig['sameCandlePolicy']) ?? 'conservative',
      volumeFillCapRatio:
        typeof obj.volumeFillCapRatio === 'number' ? obj.volumeFillCapRatio : undefined,
    };
  }

  private toMarketInfo(row: {
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
    isSpot: boolean;
    pricePrecision: number;
    amountPrecision: number;
    minNotional: { toString(): string } | null;
    lastPrice: { toString(): string } | null;
    volume24h: { toString(): string } | null;
  }): MarketInfo {
    return {
      symbol: row.symbol,
      baseAsset: row.baseAsset,
      quoteAsset: row.quoteAsset,
      isSpot: row.isSpot,
      pricePrecision: row.pricePrecision,
      amountPrecision: row.amountPrecision,
      minNotional: row.minNotional?.toString(),
      lastPrice: row.lastPrice?.toString(),
      volume24h: row.volume24h?.toString(),
    };
  }

  private async loadCandles(
    marketId: string,
    resolution: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<Candle[]> {
    const rows = await prisma.candle.findMany({
      where: {
        marketId,
        resolution,
        timestamp: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      },
      orderBy: { timestamp: 'asc' },
    });
    return rows.map(r => ({
      timestamp: r.timestamp.getTime(),
      open: r.open.toString(),
      high: r.high.toString(),
      low: r.low.toString(),
      close: r.close.toString(),
      volume: r.volume.toString(),
    }));
  }

  private async persistResults(backtestId: string, result: BacktestResult): Promise<void> {
    const equityCurve =
      result.equityCurve.length > MAX_EQUITY_POINTS
        ? result.equityCurve.filter((_, i) => i % Math.ceil(result.equityCurve.length / MAX_EQUITY_POINTS) === 0)
        : result.equityCurve;

    await prisma.backtest.update({
      where: { id: backtestId },
      data: {
        results: {
          metrics: result.metrics,
          equityCurve,
          warnings: result.warnings,
          candlesProcessed: result.candlesProcessed,
        } as object,
      },
    });

    await prisma.backtestTrade.deleteMany({ where: { backtestId } });
    if (result.trades.length > 0) {
      await prisma.backtestTrade.createMany({
        data: result.trades.map(t => ({
          backtestId,
          timestamp: new Date(t.timestamp),
          side: t.side as never,
          price: t.price,
          quantity: t.quantity,
          fee: t.fee,
          pnl: t.pnl,
        })),
      });
    }
  }

  private progress(backtestId: string, status: string, pct: number): void {
    this.events.publish('backtest.progress', { backtestId, status, progress: pct });
  }

  // ==========================================================================
  // Optimization
  // ==========================================================================

  async runOptimization(optimizationId: string): Promise<void> {
    const job = await prisma.optimizationJob.findUnique({ where: { id: optimizationId } });
    if (!job) {
      logger.warn(`Optimization job ${optimizationId} not found`);
      return;
    }

    await prisma.optimizationJob.update({
      where: { id: optimizationId },
      data: { status: OptimizationStatus.RUNNING },
    });

    try {
      const spec = (job.config ?? {}) as { base?: unknown; ranges?: Record<string, RangeSpec> };
      const baseConfig = GridConfigSchema.parse(spec.base ?? {});
      const ranges = spec.ranges ?? {};
      const combos = this.expandCombos(baseConfig, ranges, job.maxCombos);

      if (combos.length === 0) {
        throw new Error('No parameter combinations produced from the declared ranges');
      }

      let best:
        | { comboIndex: number; params: Record<string, unknown>; totalPnL: Decimal; backtestId: string; results: BacktestResult }
        | undefined;

      for (let i = 0; i < combos.length; i++) {
        const { params, config } = combos[i];

        const backtest = await prisma.backtest.create({
          data: {
            userId: job.userId,
            name: `${job.symbol} opt ${i + 1}/${combos.length}`,
            symbol: job.symbol,
            dateFrom: job.dateFrom,
            dateTo: job.dateTo,
            resolution: job.resolution,
            config: {
              symbol: job.symbol,
              dateFrom: job.dateFrom.toISOString(),
              dateTo: job.dateTo.toISOString(),
              resolution: job.resolution,
              config,
            } as object,
            status: BacktestStatus.PENDING,
            optimizationId,
          },
        });

        const row = await prisma.backtest.findUnique({ where: { id: backtest.id } });
        const cfg = this.parseConfig(row!.config);
        const result = await this.execute(cfg, `opt_${optimizationId.slice(0, 6)}_${i}`);

        if (result.success && result.metrics) {
          await this.persistResults(backtest.id, result).catch(() => undefined);
          await prisma.backtest.update({
            where: { id: backtest.id },
            data: { status: BacktestStatus.COMPLETED, completedAt: new Date() },
          });

          const totalPnL = new Decimal(result.metrics.totalPnL);
          if (!best || totalPnL.gt(best.totalPnL)) {
            best = { comboIndex: i, params, totalPnL, backtestId: backtest.id, results: result };
          }
        } else {
          await prisma.backtest.update({
            where: { id: backtest.id },
            data: {
              status: BacktestStatus.FAILED,
              error: result.error || 'Combo failed',
              completedAt: new Date(),
            },
          });
        }

        const pct = Math.round(((i + 1) / combos.length) * 100);
        await prisma.optimizationJob.update({ where: { id: optimizationId }, data: { progress: pct } });
        this.events.publish('backtest.progress', { optimizationId, progress: pct, combo: i + 1, total: combos.length });
      }

      await prisma.optimizationJob.update({
        where: { id: optimizationId },
        data: {
          status: OptimizationStatus.COMPLETED,
          completedAt: new Date(),
          maxCombos: combos.length,
          bestResult: best
            ? ({
                comboIndex: best.comboIndex,
                params: best.params,
                totalPnL: best.totalPnL.toFixed(8),
                backtestId: best.backtestId,
                metrics: best.results.metrics,
              } as object)
            : undefined,
        },
      });
      logger.info(`Optimization ${optimizationId} completed (${combos.length} combos)`);
    } catch (err) {
      const message = String((err as Error)?.message || err);
      logger.error(`Optimization ${optimizationId} failed: ${message}`);
      await prisma.optimizationJob
        .update({
          where: { id: optimizationId },
          data: { status: OptimizationStatus.FAILED, error: message.slice(0, 2000), completedAt: new Date() },
        })
        .catch(() => undefined);
    }
  }

  /**
   * Cartesian expansion of declared parameter ranges, capped at maxCombos.
   * Numeric params are applied as numbers; string-typed GridConfig fields
   * (prices, amounts) are stringified.
   */
  private static STRING_FIELDS = new Set([
    'lowerPrice',
    'upperPrice',
    'totalInvestmentQuote',
    'quotePerGrid',
    'basePerGrid',
    'stopLossPrice',
    'takeProfitPrice',
    'maxQuoteExposure',
    'maxBaseExposure',
  ]);

  private expandCombos(
    base: GridConfig,
    ranges: Record<string, RangeSpec>,
    maxCombos: number,
  ): Array<{ params: Record<string, unknown>; config: GridConfig }> {
    const entries = Object.entries(ranges).map(([key, spec]) => {
      const values: Array<number | string> = [];
      if (Array.isArray(spec.values) && spec.values.length > 0) {
        values.push(...spec.values);
      } else if (typeof spec.from === 'number' && typeof spec.to === 'number') {
        const span = spec.to - spec.from;
        const step = spec.step && spec.step > 0 ? spec.step : span > 0 ? span / 10 : 1;
        const count = Math.max(Math.floor(span / step) + 1, 1);
        for (let i = 0; i < count && i < 50; i++) {
          values.push(Number((spec.from + i * step).toPrecision(12)));
        }
      }
      return { key: spec.param || key, values };
    });

    const active = entries.filter(e => e.values.length > 0);
    if (active.length === 0) return [{ params: {}, config: { ...base } }];

    const combos: Array<{ params: Record<string, unknown>; config: GridConfig }> = [];
    const walk = (idx: number, chosen: Record<string, unknown>): void => {
      if (combos.length >= maxCombos) return;
      if (idx === active.length) {
        combos.push({ params: { ...chosen }, config: GridConfigSchema.parse({ ...base, ...chosen }) });
        return;
      }
      for (const value of active[idx].values) {
        if (combos.length >= maxCombos) return;
        const key = active[idx].key;
        chosen[key] = BacktestRunner.STRING_FIELDS.has(key) ? String(value) : value;
        walk(idx + 1, chosen);
      }
    };
    walk(0, {});

    return combos;
  }
}
