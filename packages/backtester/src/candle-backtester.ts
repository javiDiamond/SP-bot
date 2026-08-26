/**
 * Candle-Based Backtester
 *
 * Runs the shared GridEngine over historical candles via BacktestExchangePort
 * (spec §9: "reuse same strategy logic"). Supports:
 * - Conservative configurable same-candle fill ordering (documented assumption)
 * - Fee-aware fills, slippage, volume-based partial fill caps
 * - Equity curve, buy-and-hold benchmark, data-quality warnings
 */

import Decimal from 'decimal.js';
import pino from 'pino';
import {
  Candle,
  GridConfig,
  MarketInfo,
  OrderSide,
  generateClientOrderId,
} from '@wallex/shared';
import { GridEngine, GridFillEvent, GridMetrics } from '@wallex/grid-strategy';
import { BacktestExchangePort } from './backtest-exchange';

const logger = pino({ name: 'candle-backtester' });

export type SameCandlePolicy = 'conservative' | 'aggressive';

export interface BacktestConfig {
  symbol: string;
  market: MarketInfo;
  config: GridConfig;
  candles: Candle[]; // sorted ascending by timestamp
  initialBalances?: Record<string, string>;
  feeOverrides?: { makerFeeRate?: string; takerFeeRate?: string };
  /** Slippage in bps applied adversely to the limit price on fills. */
  slippageBps?: number;
  sameCandlePolicy?: SameCandlePolicy;
  /** Max fraction of candle volume a single order may consume (0 disables). */
  volumeFillCapRatio?: number;
  botId?: string;
}

export interface BacktestTrade {
  timestamp: number;
  side: OrderSide;
  price: string;
  quantity: string;
  fee: string;
  pnl: string;
  levelIndex: number;
}

export interface BacktestMetrics {
  finalRealizedPnL: string;
  finalUnrealizedPnL: string;
  totalPnL: string;
  totalFees: string;
  totalBuys: number;
  totalSells: number;
  gridCycles: number;
  maxDrawdownPct: string;
  winRatePct: string;
  gridProfitPct: string;
  buyAndHoldPct: string;
  startEquity: string;
  endEquity: string;
}

export interface BacktestResult {
  success: boolean;
  error?: string;
  metrics?: BacktestMetrics;
  trades: BacktestTrade[];
  equityCurve: Array<{ timestamp: number; equity: string; price: string }>;
  warnings: string[];
  candlesProcessed: number;
}

export class CandleBasedBacktester {
  private readonly cfg: BacktestConfig;
  private readonly port: BacktestExchangePort;
  private readonly engine: GridEngine;
  private readonly trades: BacktestTrade[] = [];
  private readonly warnings: string[] = [];
  private readonly equityCurve: Array<{ timestamp: number; equity: string; price: string }> = [];
  private readonly slippage: Decimal;
  private readonly volumeCapRatio: Decimal;
  private readonly sameCandlePolicy: SameCandlePolicy;
  private candleTime = 0;

  constructor(config: BacktestConfig) {
    this.cfg = config;
    this.slippage = new Decimal(config.slippageBps ?? 0).div(10000);
    this.volumeCapRatio = new Decimal(config.volumeFillCapRatio ?? 0);
    this.sameCandlePolicy = config.sameCandlePolicy ?? 'conservative';

    const base = config.market.baseAsset;
    const quote = config.market.quoteAsset;
    const initialBalances = config.initialBalances || {
      [quote]: config.config.totalInvestmentQuote || '10000',
      [base]: '0',
    };

    this.port = new BacktestExchangePort({
      symbol: config.symbol,
      market: config.market,
      initialBalances,
      makerFeeRate: config.feeOverrides?.makerFeeRate || '0.0035',
      takerFeeRate: config.feeOverrides?.takerFeeRate || '0.0035',
    });

    const botId = config.botId || 'backtest';
    let orderSeq = 0;

    this.engine = new GridEngine({
      botId,
      symbol: config.symbol,
      config: { ...config.config },
      market: config.market,
      exchange: this.port,
      now: () => this.candleTime,
      // Deterministic, collision-free order ids for backtests
      generateOrderId: (side, levelIndex) => {
        orderSeq += 1;
        return generateClientOrderId(botId, side === OrderSide.BUY ? 'BUY' : 'SELL', levelIndex, `bt${orderSeq}`);
      },
      hooks: {
        onFill: fill => this.recordTrade(fill),
        onOrder: event => {
          if (event.action === 'PLACE') {
            this.armedAtByOrder.set(event.request.clientOrderId, this.candleTime);
          }
        },
        onEvent: (level, event, message) => {
          if (level === 'WARN' || level === 'ERROR') {
            this.warnings.push(`${event}: ${message}`);
          }
        },
      },
    });
  }

  async run(): Promise<BacktestResult> {
    const candles = this.cfg.candles;
    if (!candles || candles.length === 0) {
      return {
        success: false,
        error: 'No candle data available for backtest period',
        trades: [],
        equityCurve: [],
        warnings: this.warnings,
        candlesProcessed: 0,
      };
    }

    this.checkDataQuality(candles);

    await this.engine.initialize();

    const first = candles[0];
    this.candleTime = first.timestamp;
    this.port.setLastPrice(first.open);

    // Prime the engine with the opening price (sets currentPrice without placing)
    await this.engine.onPriceTick(first.open, this.mockDepth(first.open));
    await this.engine.start();

    let peakEquity = new Decimal(0);
    let maxDrawdownPct = new Decimal(0);
    let startEquity: Decimal | undefined;
    let endEquity = new Decimal(0);

    for (const candle of candles) {
      this.candleTime = candle.timestamp;
      this.port.setLastPrice(candle.close);

      // 1) Fill resting orders based on candle extremes.
      //    Conservative policy: only orders resting BEFORE this candle are eligible,
      //    preventing guaranteed same-candle round trips. Aggressive allows
      //    orders armed during this candle to fill within it.
      await this.applyCandleFills(candle, this.sameCandlePolicy === 'conservative');

      // 2) Run strategy logic at the close (range checks, recenter, SL/TP, retries)
      await this.engine.onPriceTick(candle.close, this.mockDepth(candle.close));

      // 3) Equity snapshot
      const equity = this.computeEquity(candle.close);
      if (startEquity === undefined) startEquity = equity;
      endEquity = equity;
      if (equity.gt(peakEquity)) peakEquity = equity;
      if (peakEquity.gt(0)) {
        const dd = peakEquity.minus(equity).div(peakEquity).times(100);
        if (dd.gt(maxDrawdownPct)) maxDrawdownPct = dd;
      }
      this.equityCurve.push({
        timestamp: candle.timestamp,
        equity: equity.toFixed(8),
        price: candle.close,
      });
    }

    const metrics = this.engine.getMetrics();
    const buyAndHoldPct = new Decimal(candles[candles.length - 1].close)
      .div(candles[0].open)
      .minus(1)
      .times(100);

    const start = startEquity ?? new Decimal(0);
    const gridProfitPct = start.gt(0)
      ? endEquity.minus(start).div(start).times(100)
      : new Decimal(0);

    const totalPnL = new Decimal(metrics.realizedPnL).plus(metrics.unrealizedPnL);
    const winRatePct = this.computeWinRate();

    const result: BacktestMetrics = {
      finalRealizedPnL: metrics.realizedPnL,
      finalUnrealizedPnL: metrics.unrealizedPnL,
      totalPnL: totalPnL.toFixed(8),
      totalFees: metrics.totalFees,
      totalBuys: metrics.totalBuys,
      totalSells: metrics.totalSells,
      gridCycles: metrics.completedCycles,
      maxDrawdownPct: maxDrawdownPct.toFixed(4),
      winRatePct: winRatePct.toFixed(2),
      gridProfitPct: gridProfitPct.toFixed(4),
      buyAndHoldPct: buyAndHoldPct.toFixed(4),
      startEquity: start.toFixed(8),
      endEquity: endEquity.toFixed(8),
    };

    logger.info(
      {
        symbol: this.cfg.symbol,
        candles: candles.length,
        trades: this.trades.length,
        totalPnL: result.totalPnL,
      },
      'Backtest completed',
    );

    return {
      success: true,
      metrics: result,
      trades: this.trades,
      equityCurve: this.equityCurve,
      warnings: this.warnings,
      candlesProcessed: candles.length,
    };
  }

  // ==========================================================================
  // Fill simulation
  // ==========================================================================

  private async applyCandleFills(candle: Candle, conservative: boolean): Promise<void> {
    const high = new Decimal(candle.high);
    const low = new Decimal(candle.low);
    const volume = new Decimal(candle.volume || '0');

    // Snapshot resting orders; in conservative mode orders armed during this
    // candle (e.g. by earlier fills) are excluded automatically because the
    // snapshot is taken before processing.
    const resting = this.port.restingOrders(this.cfg.symbol);

    // Path assumption: bullish candle (close >= open) -> low touched before high
    // (buys fill first); bearish -> sells fill first. Documented assumption.
    const bullish = new Decimal(candle.close).gte(candle.open);
    const ordered = [...resting].sort((a, b) => {
      const aIsBuy = a.side === OrderSide.BUY ? 0 : 1;
      const bIsBuy = b.side === OrderSide.BUY ? 0 : 1;
      return bullish ? aIsBuy - bIsBuy : bIsBuy - aIsBuy;
    });

    let remainingVolume = volume;

    for (const order of ordered) {
      if (conservative && this.armedDuringCandle(order.clientOrderId)) continue;

      const crosses =
        order.side === OrderSide.BUY ? low.lte(order.price) : high.gte(order.price);
      if (!crosses) continue;

      // Volume-based partial fill cap
      let fillQty = order.quantity;
      if (this.volumeCapRatio.gt(0) && volume.gt(0)) {
        const cap = remainingVolume.times(this.volumeCapRatio);
        if (fillQty.gt(cap)) fillQty = cap;
        if (fillQty.lte(0)) continue;
        remainingVolume = remainingVolume.minus(fillQty);
      }

      // Slippage adverse to the trader
      const slip = order.price.times(this.slippage);
      const fillPrice =
        order.side === OrderSide.BUY
          ? order.price.plus(slip)
          : order.price.minus(slip);

      const feeRate = new Decimal(
        (await this.port.getFees(this.cfg.symbol)).makerFeeRate,
      );
      const fee = fillPrice.times(fillQty).times(feeRate);

      const applied = this.port.applyFill(
        order.clientOrderId,
        fillPrice.toFixed(this.cfg.market.pricePrecision),
        fillQty.toFixed(this.cfg.market.amountPrecision, Decimal.ROUND_DOWN),
        fee.toFixed(8),
        candle.timestamp,
      );
      if (!applied) continue;

      await this.engine.handleFillReport(order.clientOrderId, {
        price: applied.price,
        quantity: applied.quantity,
        fee: applied.fee,
        feeAsset: applied.feeAsset,
      });
    }
  }

  private armedAtByOrder = new Map<string, number>();

  private armedDuringCandle(clientOrderId: string): boolean {
    const armedAt = this.armedAtByOrder.get(clientOrderId);
    return armedAt === this.candleTime;
  }

  private mockDepth(price: string): { bestBid?: string; bestAsk?: string } {
    const p = new Decimal(price);
    const tick = p.times('0.0001');
    return {
      bestBid: p.minus(tick).toString(),
      bestAsk: p.plus(tick).toString(),
    };
  }

  // ==========================================================================
  // Metrics helpers
  // ==========================================================================

  private recordTrade(fill: GridFillEvent): void {
    let pnl: Decimal;
    if (fill.side === OrderSide.SELL) {
      pnl = new Decimal(fill.realizedPnL ?? new Decimal(fill.fee).negated().toString());
    } else {
      pnl = new Decimal(fill.fee).negated();
    }

    this.trades.push({
      timestamp: fill.timestamp,
      side: fill.side,
      price: fill.price,
      quantity: fill.quantity,
      fee: fill.fee,
      pnl: pnl.toFixed(8),
      levelIndex: fill.levelIndex,
    });
  }

  private computeEquity(price: string): Decimal {
    const p = new Decimal(price);
    const base = this.cfg.market.baseAsset;
    const quote = this.cfg.market.quoteAsset;
    const port = this.port.getPortfolio();
    const quoteTotal = port.total[quote] ?? new Decimal(0);
    const baseAmt = port.total[base] ?? new Decimal(0);
    return quoteTotal.plus(baseAmt.times(p));
  }

  private computeWinRate(): Decimal {
    const sells = this.trades.filter(t => t.side === OrderSide.SELL);
    if (sells.length === 0) return new Decimal(0);
    const wins = sells.filter(t => new Decimal(t.pnl).gt(0)).length;
    return new Decimal(wins).div(sells.length).times(100);
  }

  private checkDataQuality(candles: Candle[]): void {
    if (candles.length < 10) {
      this.warnings.push(`Low candle count (${candles.length}); results may be unreliable`);
    }

    let gaps = 0;
    let zeroVolume = 0;
    for (let i = 1; i < candles.length; i++) {
      const expected = candles[i - 1].timestamp;
      const delta = candles[i].timestamp - expected;
      // median-ish expectation: sample first interval
      const baseInterval = candles[1] && candles[0] ? candles[1].timestamp - candles[0].timestamp : delta;
      if (baseInterval > 0 && delta > baseInterval * 1.5) gaps += 1;
      if (new Decimal(candles[i].volume || '0').isZero()) zeroVolume += 1;
    }

    if (gaps > 0) {
      this.warnings.push(`${gaps} candle gap(s) detected in data`);
    }
    if (candles.length > 0 && zeroVolume / candles.length > 0.5) {
      this.warnings.push('Majority of candles have zero volume; volume caps disabled effectively');
    }
  }
}

export default CandleBasedBacktester;
