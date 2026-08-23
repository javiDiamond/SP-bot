/**
 * Grid Trading Strategy Engine
 * 
 * Implements spot grid trading logic:
 * - Grid level generation (arithmetic/geometric)
 * - Order placement and management
 * - Fill handling and opposite order creation
 * - PnL calculation
 * - Range exit behavior
 */

import EventEmitter from 'events';
import Decimal from 'decimal.js';
import pino from 'pino';
import {
  TRADING_MODES,
  GRID_TYPES,
  ORDER_SIDES,
  ORDER_TYPES,
  GRID_LEVEL_STATUSES,
  RANGE_EXIT_BEHAVIORS,
  INVENTORY_MODES,
  type GridConfig,
  type Market,
} from '@wallex-grid/shared';

// ============================================================================
// Types
// ============================================================================

export interface GridLevel {
  index: number;
  price: string;
  side: 'BUY' | 'SELL';
  status: keyof typeof GRID_LEVEL_STATUSES;
  buyOrderId?: string;
  sellOrderId?: string;
  filledQuantity?: string;
  averageCost?: string;
  realizedProfit?: string;
}

export interface GridState {
  levels: GridLevel[];
  currentPrice: string;
  inRange: boolean;
  lastRecenterTime?: number;
}

export interface GridOrder {
  clientOrderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: string;
  quantity: string;
  levelIndex: number;
  isInitial: boolean;
}

export interface GridFill {
  orderId: string;
  levelIndex: number;
  side: 'BUY' | 'SELL';
  price: string;
  quantity: string;
  fee: string;
  timestamp: number;
}

export interface GridMetrics {
  totalGrids: number;
  activeGrids: number;
  completedCycles: number;
  realizedProfit: string;
  unrealizedPnL: string;
  totalFees: string;
  buyCount: number;
  sellCount: number;
}

export interface ExchangeAdapter {
  createOrder(order: any): Promise<any>;
  cancelOrder(clientOrderId: string): Promise<any>;
  getOrder(clientOrderId: string): Promise<any>;
  getOpenOrders(symbol?: string): Promise<any>;
  getBalances(): Promise<any>;
}

export interface GridEngineConfig {
  config: GridConfig;
  market: Market;
  exchange: ExchangeAdapter;
  tradingMode: 'DRY_RUN' | 'LIVE';
}

// ============================================================================
// Logger
// ============================================================================

const logger = pino({ name: 'grid-engine' });

// ============================================================================
// Grid Engine
// ============================================================================

export class GridEngine extends EventEmitter {
  private config: GridEngineConfig;
  private state: GridState | null = null;
  private orders: Map<string, GridOrder> = new Map();
  private fills: GridFill[] = [];
  private isRunning: boolean = false;
  private makerFeeRate: Decimal;
  private takerFeeRate: Decimal;

  constructor(config: GridEngineConfig) {
    super();
    this.config = config;
    
    // Default fees (will be updated from exchange)
    this.makerFeeRate = new Decimal('0.0035');
    this.takerFeeRate = new Decimal('0.0035');
  }

  /**
   * Initialize grid engine
   */
  async initialize(currentPrice: string): Promise<void> {
    logger.info({ symbol: this.config.config.symbol, currentPrice }, 'Initializing grid engine');

    const gridLevels = this.generateGridLevels(currentPrice);
    
    this.state = {
      levels: gridLevels,
      currentPrice,
      inRange: this.isPriceInRange(currentPrice),
      lastRecenterTime: undefined,
    };

    this.emit('initialized', { levels: gridLevels, currentPrice });
    logger.info({ levelCount: gridLevels.length }, 'Grid initialized');
  }

  /**
   * Generate grid levels based on configuration
   */
  generateGridLevels(currentPrice: string): GridLevel[] {
    const { config, market } = this.config;
    const lowerPrice = new Decimal(config.lowerPrice);
    const upperPrice = new Decimal(config.upperPrice);
    const gridCount = config.gridCount;
    const pricePrecision = market.pricePrecision;

    let levels: string[] = [];

    if (config.gridType === GRID_TYPES.ARITHMETIC) {
      levels = this.calculateArithmeticLevels(lowerPrice, upperPrice, gridCount, pricePrecision);
    } else {
      levels = this.calculateGeometricLevels(lowerPrice, upperPrice, gridCount, pricePrecision);
    }

    // Create grid level objects
    const currentPriceDec = new Decimal(currentPrice);
    const gridLevels: GridLevel[] = [];

    for (let i = 0; i < levels.length; i++) {
      const price = levels[i];
      const priceDec = new Decimal(price);

      // Determine side based on current price
      let side: 'BUY' | 'SELL' = 'BUY';
      if (priceDec.gt(currentPriceDec)) {
        side = 'SELL';
      }

      gridLevels.push({
        index: i,
        price,
        side,
        status: 'IDLE',
      });
    }

    return gridLevels;
  }

  /**
   * Calculate arithmetic grid levels
   */
  private calculateArithmeticLevels(
    lower: Decimal,
    upper: Decimal,
    count: number,
    precision: number
  ): string[] {
    const step = upper.minus(lower).div(count);
    const levels: string[] = [];

    for (let i = 0; i <= count; i++) {
      const level = lower.plus(step.times(i));
      levels.push(this.roundToPrecision(level, precision));
    }

    return levels;
  }

  /**
   * Calculate geometric grid levels
   */
  private calculateGeometricLevels(
    lower: Decimal,
    upper: Decimal,
    count: number,
    precision: number
  ): string[] {
    const ratio = upper.div(lower).pow(1 / count);
    const levels: string[] = [];

    for (let i = 0; i <= count; i++) {
      const level = lower.times(ratio.pow(i));
      levels.push(this.roundToPrecision(level, precision));
    }

    return levels;
  }

  /**
   * Round decimal to market precision
   */
  private roundToPrecision(value: Decimal, precision: number): string {
    const factor = new Decimal(10).pow(precision);
    return value.times(factor).toNearest(1).div(factor).toString();
  }

  /**
   * Check if price is within grid range
   */
  isPriceInRange(price: string): boolean {
    const priceDec = new Decimal(price);
    const lower = new Decimal(this.config.config.lowerPrice);
    const upper = new Decimal(this.config.config.upperPrice);

    return priceDec.gte(lower) && priceDec.lte(upper);
  }

  /**
   * Validate minimum profit after fees
   */
  validateMinProfit(buyPrice: string, sellPrice: string): { valid: boolean; profitBps: number } {
    const buy = new Decimal(buyPrice);
    const sell = new Decimal(sellPrice);
    const spread = sell.minus(buy).div(buy);
    const totalFees = this.makerFeeRate.plus(this.takerFeeRate);
    const minProfit = new Decimal(this.config.config.minProfitAfterFeesBps).div(10000);

    const profitBps = spread.minus(totalFees).times(10000).toNumber();

    return {
      valid: spread.gte(totalFees.plus(minProfit)),
      profitBps,
    };
  }

  /**
   * Update current price
   */
  updatePrice(price: string): void {
    if (!this.state) return;

    const wasInRange = this.state.inRange;
    this.state.inRange = this.isPriceInRange(price);
    this.state.currentPrice = price;

    // Handle range exit
    if (wasInRange && !this.state.inRange) {
      this.handleRangeExit(price);
    }

    this.emit('price.update', { price, inRange: this.state.inRange });
  }

  /**
   * Handle price exiting grid range
   */
  private handleRangeExit(price: string): void {
    const { onRangeExit } = this.config.config;

    logger.warn({ price, behavior: onRangeExit }, 'Price exited grid range');
    this.emit('range.exit', { price, behavior: onRangeExit });

    switch (onRangeExit) {
      case RANGE_EXIT_BEHAVIORS.PAUSE_KEEP_ORDERS:
        // Keep orders, just pause new placements
        break;

      case RANGE_EXIT_BEHAVIORS.PAUSE_CANCEL_ALL:
        this.emit('cancel.all', 'Range exit');
        break;

      case RANGE_EXIT_BEHAVIORS.STOP_CANCEL_ALL:
        this.stop();
        this.emit('cancel.all', 'Range exit stop');
        break;

      case RANGE_EXIT_BEHAVIORS.RECENTER:
        if (this.canRecenter()) {
          this.emit('recenter.request', price);
        }
        break;

      case RANGE_EXIT_BEHAVIORS.TRAILING:
        // Trailing logic would go here
        break;
    }
  }

  /**
   * Check if recenter is allowed
   */
  canRecenter(): boolean {
    if (!this.config.config.autoRecenter) return false;
    
    const cooldown = this.config.config.recenterCooldownMinutes || 60;
    if (this.state?.lastRecenterTime) {
      const elapsed = Date.now() - this.state.lastRecenterTime;
      if (elapsed < cooldown * 60 * 1000) {
        return false;
      }
    }

    return true;
  }

  /**
   * Recenter grid around current price
   */
  recenter(newPrice: string): void {
    if (!this.state) return;

    logger.info({ newPrice }, 'Recentering grid');

    // Regenerate grid levels
    const newLevels = this.generateGridLevels(newPrice);
    
    this.state.levels = newLevels;
    this.state.lastRecenterTime = Date.now();
    this.state.inRange = true;

    this.emit('grid.recentered', { levels: newLevels, price: newPrice });
  }

  /**
   * Get grid metrics
   */
  getMetrics(): GridMetrics {
    if (!this.state) {
      return {
        totalGrids: 0,
        activeGrids: 0,
        completedCycles: 0,
        realizedProfit: '0',
        unrealizedPnL: '0',
        totalFees: '0',
        buyCount: 0,
        sellCount: 0,
      };
    }

    const activeLevels = this.state.levels.filter(l => 
      l.status !== 'IDLE' && l.status !== 'ERROR'
    );

    const completedCycles = this.state.levels.filter(l => 
      l.status === 'SELL_FILLED'
    ).length;

    const realizedProfit = this.state.levels.reduce((sum, level) => {
      return sum.plus(new Decimal(level.realizedProfit || '0'));
    }, new Decimal(0));

    const totalFees = this.fills.reduce((sum, fill) => {
      return sum.plus(new Decimal(fill.fee));
    }, new Decimal(0));

    const buyCount = this.fills.filter(f => f.side === 'BUY').length;
    const sellCount = this.fills.filter(f => f.side === 'SELL').length;

    return {
      totalGrids: this.state.levels.length,
      activeGrids: activeLevels.length,
      completedCycles,
      realizedProfit: realizedProfit.toString(),
      unrealizedPnL: '0', // Would need current prices to calculate
      totalFees: totalFees.toString(),
      buyCount,
      sellCount,
    };
  }

  /**
   * Start grid engine
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Grid engine already running');
      return;
    }

    logger.info('Starting grid engine');
    this.isRunning = true;
    this.emit('started');
  }

  /**
   * Stop grid engine
   */
  stop(): void {
    if (!this.isRunning) return;

    logger.info('Stopping grid engine');
    this.isRunning = false;
    this.emit('stopped');
  }

  /**
   * Pause grid engine
   */
  pause(): void {
    logger.info('Pausing grid engine');
    this.isRunning = false;
    this.emit('paused');
  }

  /**
   * Resume grid engine
   */
  resume(): void {
    logger.info('Resuming grid engine');
    this.isRunning = true;
    this.emit('resumed');
  }

  /**
   * Get current state
   */
  getState(): GridState | null {
    return this.state;
  }

  /**
   * Get all fills
   */
  getFills(): GridFill[] {
    return [...this.fills];
  }

  /**
   * Record a fill
   */
  recordFill(fill: GridFill): void {
    this.fills.push(fill);

    if (!this.state) return;

    const level = this.state.levels[fill.levelIndex];
    if (level) {
      // Update level status based on fill
      if (fill.side === 'BUY') {
        level.status = 'BUY_FILLED';
        level.filledQuantity = fill.quantity;
        level.averageCost = fill.price;
      } else {
        level.status = 'SELL_FILLED';
        // Calculate realized profit
        if (level.averageCost) {
          const buyPrice = new Decimal(level.averageCost);
          const sellPrice = new Decimal(fill.price);
          const quantity = new Decimal(fill.quantity);
          const profit = sellPrice.minus(buyPrice).times(quantity);
          level.realizedProfit = profit.toString();
        }
      }
    }

    this.emit('fill.recorded', fill);
    logger.info({ ...fill }, 'Fill recorded');
  }
}

export default GridEngine;
