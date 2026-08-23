/**
 * Backtesting Engine
 * 
 * Simulates grid trading on historical candle data:
 * - Candle-based simulation
 * - Conservative fill logic
 * - PnL calculation
 * - Metrics generation
 */

import EventEmitter from 'events';
import Decimal from 'decimal.js';
import pino from 'pino';
import { type GridConfig, GRID_TYPES } from '@wallex/shared';

// ============================================================================
// Types
// ============================================================================

export interface Candle {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface BacktestConfig {
  gridConfig: GridConfig;
  symbol: string;
  startTime: number;
  endTime: number;
  initialBalances: Record<string, string>;
  makerFeeRate: string;
  takerFeeRate: string;
}

export interface BacktestTrade {
  timestamp: number;
  candleIndex: number;
  side: 'BUY' | 'SELL';
  price: string;
  quantity: string;
  fee: string;
  levelIndex: number;
  pnl?: string;
}

export interface BacktestResult {
  totalReturn: string;
  realizedProfit: string;
  unrealizedPnL: string;
  totalFees: string;
  finalBalances: Record<string, string>;
  tradeCount: number;
  buyCount: number;
  sellCount: number;
  completedCycles: number;
  maxDrawdown: string;
  sharpeRatio?: string;
  trades: BacktestTrade[];
  equityCurve: Array<{ timestamp: number; value: string }>;
  warnings: string[];
}

// ============================================================================
// Logger
// ============================================================================

const logger = pino({ name: 'backtester' });

// ============================================================================
// Backtest Engine
// ============================================================================

export class BacktestEngine extends EventEmitter {
  private config: BacktestConfig;
  private candles: Candle[] = [];
  private trades: BacktestTrade[] = [];
  private balances: Map<string, Decimal>;
  private gridLevels: string[] = [];
  private activeOrders: Map<number, { side: 'BUY' | 'SELL'; price: string; quantity: string }> = new Map();
  private makerFeeRate: Decimal;
  private takerFeeRate: Decimal;
  private initialPortfolioValue: Decimal = new Decimal(0);
  private equityCurve: Array<{ timestamp: number; value: string }> = [];

  constructor(config: BacktestConfig) {
    super();
    this.config = config;
    
    // Initialize balances
    this.balances = new Map();
    Object.entries(config.initialBalances).forEach(([asset, amount]) => {
      this.balances.set(asset, new Decimal(amount));
    });

    // Fee rates
    this.makerFeeRate = new Decimal(config.makerFeeRate);
    this.takerFeeRate = new Decimal(config.takerFeeRate);
  }

  /**
   * Load candle data
   */
  loadCandles(candles: Candle[]): void {
    // Filter by time range
    this.candles = candles.filter(c => 
      c.timestamp >= this.config.startTime && 
      c.timestamp <= this.config.endTime
    );

    logger.info({ count: this.candles.length }, 'Candles loaded');
  }

  /**
   * Generate grid levels
   */
  generateGridLevels(): void {
    const { gridConfig } = this.config;
    const lower = new Decimal(gridConfig.lowerPrice);
    const upper = new Decimal(gridConfig.upperPrice);
    const count = gridConfig.gridCount;

    if (gridConfig.gridType === GRID_TYPES.ARITHMETIC) {
      const step = upper.minus(lower).div(count);
      for (let i = 0; i <= count; i++) {
        const level = lower.plus(step.times(i));
        this.gridLevels.push(level.toString());
      }
    } else {
      const ratio = upper.div(lower).pow(1 / count);
      for (let i = 0; i <= count; i++) {
        const level = lower.times(ratio.pow(i));
        this.gridLevels.push(level.toString());
      }
    }

    logger.info({ levels: this.gridLevels.length }, 'Grid levels generated');
  }

  /**
   * Run backtest
   */
  run(): BacktestResult {
    logger.info('Starting backtest');
    this.emit('started');

    if (!this.candles.length) {
      throw new Error('No candle data loaded');
    }

    // Generate grid levels
    this.generateGridLevels();

    // Calculate initial portfolio value
    this.initialPortfolioValue = this.calculatePortfolioValue(this.candles[0].open);

    // Process each candle
    this.candles.forEach((candle, index) => {
      this.processCandle(candle, index);
      
      // Record equity curve point
      const portfolioValue = this.calculatePortfolioValue(candle.close);
      this.equityCurve.push({
        timestamp: candle.timestamp,
        value: portfolioValue.toString(),
      });
    });

    // Calculate final results
    const result = this.calculateResults();

    logger.info({ 
      totalReturn: result.totalReturn,
      tradeCount: result.tradeCount,
    }, 'Backtest completed');

    this.emit('completed', result);
    return result;
  }

  /**
   * Process a single candle
   */
  private processCandle(candle: Candle, index: number): void {
    const { open, high, low, close } = candle;
    const openDec = new Decimal(open);
    const highDec = new Decimal(high);
    const lowDec = new Decimal(low);
    const closeDec = new Decimal(close);

    // Check each grid level
    this.gridLevels.forEach((levelPrice, levelIndex) => {
      const priceDec = new Decimal(levelPrice);

      // Check if price crossed this level during the candle
      const crossedFromAbove = openDec.gte(priceDec) && lowDec.lte(priceDec);
      const crossedFromBelow = openDec.lte(priceDec) && highDec.gte(priceDec);

      if (crossedFromAbove || crossedFromBelow) {
        // Determine order side based on current position relative to level
        const shouldBuy = closeDec.lt(priceDec);
        
        if (shouldBuy) {
          this.executeBuy(levelIndex, priceDec, index, candle.timestamp);
        } else {
          this.executeSell(levelIndex, priceDec, index, candle.timestamp);
        }
      }
    });
  }

  /**
   * Execute a buy order
   */
  private executeBuy(levelIndex: number, price: Decimal, candleIndex: number, timestamp: number): void {
    // Check if we already have an active buy at this level
    if (this.activeOrders.has(levelIndex)) {
      return;
    }

    // Calculate quantity based on available quote balance
    const quoteAsset = this.getQuoteAsset();
    const quoteBalance = this.balances.get(quoteAsset) || new Decimal(0);
    
    // Simple allocation: use a portion of available balance
    const allocation = quoteBalance.div(this.gridLevels.length);
    
    if (allocation.lt('1')) {
      return; // Insufficient balance
    }

    const fee = allocation.times(this.makerFeeRate);
    const quantity = allocation.minus(fee).div(price);

    // Update balances
    this.balances.set(quoteAsset, quoteBalance.minus(allocation));
    
    const baseAsset = this.getBaseAsset();
    const currentBase = this.balances.get(baseAsset) || new Decimal(0);
    this.balances.set(baseAsset, currentBase.plus(quantity));

    // Record trade
    const trade: BacktestTrade = {
      timestamp,
      candleIndex,
      side: 'BUY',
      price: price.toString(),
      quantity: quantity.toString(),
      fee: fee.toString(),
      levelIndex,
    };

    this.trades.push(trade);
    this.activeOrders.set(levelIndex, { side: 'BUY', price: price.toString(), quantity: quantity.toString() });

    this.emit('trade', trade);
    logger.debug({ ...trade }, 'Buy executed');
  }

  /**
   * Execute a sell order
   */
  private executeSell(levelIndex: number, price: Decimal, candleIndex: number, timestamp: number): void {
    // Check if we have an active buy at this level to close
    const activeOrder = this.activeOrders.get(levelIndex);
    
    if (!activeOrder || activeOrder.side !== 'BUY') {
      return; // No position to close
    }

    const quantity = new Decimal(activeOrder.quantity);
    const buyPrice = new Decimal(activeOrder.price);
    const sellValue = quantity.times(price);
    const fee = sellValue.times(this.makerFeeRate);

    // Calculate PnL
    const costBasis = quantity.times(buyPrice);
    const pnl = sellValue.minus(costBasis).minus(fee);

    // Update balances
    const baseAsset = this.getBaseAsset();
    const currentBase = this.balances.get(baseAsset) || new Decimal(0);
    this.balances.set(baseAsset, currentBase.minus(quantity));

    const quoteAsset = this.getQuoteAsset();
    const currentQuote = this.balances.get(quoteAsset) || new Decimal(0);
    this.balances.set(quoteAsset, currentQuote.plus(sellValue.minus(fee)));

    // Record trade
    const trade: BacktestTrade = {
      timestamp,
      candleIndex,
      side: 'SELL',
      price: price.toString(),
      quantity: quantity.toString(),
      fee: fee.toString(),
      levelIndex,
      pnl: pnl.toString(),
    };

    this.trades.push(trade);
    this.activeOrders.delete(levelIndex);

    this.emit('trade', trade);
    logger.debug({ ...trade }, 'Sell executed');
  }

  /**
   * Calculate portfolio value at a given price
   */
  private calculatePortfolioValue(price: string): Decimal {
    const baseAsset = this.getBaseAsset();
    const quoteAsset = this.getQuoteAsset();
    
    const baseBalance = this.balances.get(baseAsset) || new Decimal(0);
    const quoteBalance = this.balances.get(quoteAsset) || new Decimal(0);
    const priceDec = new Decimal(price);

    return baseBalance.times(priceDec).plus(quoteBalance);
  }

  /**
   * Get quote asset from symbol
   */
  private getQuoteAsset(): string {
    const { symbol } = this.config;
    // Simple heuristic: last 4 characters or USDT/TMN
    if (symbol.endsWith('USDT')) return 'USDT';
    if (symbol.endsWith('TMN')) return 'TMN';
    return symbol.slice(-4);
  }

  /**
   * Get base asset from symbol
   */
  private getBaseAsset(): string {
    const { symbol } = this.config;
    // Simple heuristic: everything before USDT/TMN
    if (symbol.endsWith('USDT')) return symbol.slice(0, -4);
    if (symbol.endsWith('TMN')) return symbol.slice(0, -3);
    return symbol.slice(0, -4);
  }

  /**
   * Calculate final backtest results
   */
  private calculateResults(): BacktestResult {
    const finalValue = this.equityCurve.length > 0 
      ? new Decimal(this.equityCurve[this.equityCurve.length - 1].value)
      : this.initialPortfolioValue;

    const totalReturn = finalValue.minus(this.initialPortfolioValue);
    const totalReturnPercent = totalReturn.div(this.initialPortfolioValue).times(100);

    const realizedProfit = this.trades
      .filter(t => t.side === 'SELL' && t.pnl)
      .reduce((sum, t) => sum.plus(new Decimal(t.pnl!)), new Decimal(0));

    const totalFees = this.trades
      .reduce((sum, t) => sum.plus(new Decimal(t.fee)), new Decimal(0));

    const buyCount = this.trades.filter(t => t.side === 'BUY').length;
    const sellCount = this.trades.filter(t => t.side === 'SELL').length;
    const completedCycles = Math.min(buyCount, sellCount);

    // Calculate max drawdown
    let peak = this.initialPortfolioValue;
    let maxDrawdown = new Decimal(0);

    this.equityCurve.forEach(point => {
      const value = new Decimal(point.value);
      if (value.gt(peak)) {
        peak = value;
      }
      const drawdown = peak.minus(value).div(peak);
      if (drawdown.gt(maxDrawdown)) {
        maxDrawdown = drawdown;
      }
    });

    // Build final balances
    const finalBalances: Record<string, string> = {};
    this.balances.forEach((balance, asset) => {
      finalBalances[asset] = balance.toString();
    });

    return {
      totalReturn: totalReturn.toString(),
      realizedProfit: realizedProfit.toString(),
      unrealizedPnL: '0', // Would need current market price
      totalFees: totalFees.toString(),
      finalBalances,
      tradeCount: this.trades.length,
      buyCount,
      sellCount,
      completedCycles,
      maxDrawdown: maxDrawdown.toString(),
      sharpeRatio: undefined, // Would need more complex calculation
      trades: [...this.trades],
      equityCurve: [...this.equityCurve],
      warnings: [],
    };
  }

  /**
   * Get current progress
   */
  getProgress(): { current: number; total: number; percent: number } {
    return {
      current: this.trades.length,
      total: this.candles.length,
      percent: this.candles.length > 0 
        ? (this.trades.length / this.candles.length) * 100 
        : 0,
    };
  }
}

export default BacktestEngine;
