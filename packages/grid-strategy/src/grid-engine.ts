/**
 * Grid Trading Strategy Engine
 *
 * Single source of truth for grid strategy logic, reused by dry-run bots,
 * live bots, and the backtester (spec §23). Exchange-agnostic: talks only to
 * an injected ExchangePort.
 *
 * Responsibilities:
 * - Grid level generation (arithmetic/geometric) via shared GridMath
 * - Initial order placement with balance / min-notional / precision / maker-only checks
 * - Fill handling: buy fill -> sell at next level, sell fill -> re-arm buy, realized PnL
 * - Partial fill tracking
 * - Range-exit behaviors (PAUSE_KEEP_ORDERS / PAUSE_CANCEL_ALL / STOP_CANCEL_ALL / RECENTER / TRAILING)
 * - Stop-loss / take-profit
 * - PnL and metrics
 */

import EventEmitter from 'events';
import Decimal from 'decimal.js';
import pino from 'pino';
import {
  Balance,
  ExchangePort,
  generateClientOrderId,
  GridConfig,
  GridLevelStatus,
  GridMath,
  MarketInfo,
  OrderSide,
  OrderStatus,
  OrderType,
  PlaceOrderRequest,
  PlacedOrder,
  PortDepth,
  PortFees,
} from '@wallex/shared';

const logger = pino({ name: 'grid-engine' });

// ============================================================================
// Types
// ============================================================================

export interface GridLevelState {
  levelIndex: number;
  price: string;
  status: GridLevelStatus;
  buyOrderId?: string;
  sellOrderId?: string;
  filledQuantity: string;
  averageCost?: string;
  realizedProfit: string;
  skipped?: string;
}

export interface GridFillEvent {
  clientOrderId: string;
  levelIndex: number;
  side: OrderSide;
  price: string;
  quantity: string;
  fee: string;
  feeAsset?: string;
  isMaker: boolean;
  timestamp: number;
  /** Realized PnL for sell fills (after fees, vs cost basis). */
  realizedPnL?: string;
}

export interface GridMetrics {
  totalLevels: number;
  activeLevels: number;
  completedCycles: number;
  realizedPnL: string;
  unrealizedPnL: string;
  totalFees: string;
  totalBuys: number;
  totalSells: number;
  inventoryBase: string;
  inventoryCostQuote: string;
}

export interface PreTradeResult {
  ok: boolean;
  reason?: string;
}

export interface GridEngineHooks {
  onLevel?: (level: GridLevelState) => void | Promise<void>;
  onOrder?: (event: {
    action: 'PLACE' | 'CANCEL' | 'FAILED';
    request: PlaceOrderRequest;
    result?: PlacedOrder;
    reason?: string;
  }) => void | Promise<void>;
  onFill?: (fill: GridFillEvent) => void | Promise<void>;
  onStats?: (stats: GridMetrics) => void | Promise<void>;
  onEvent?: (
    level: 'INFO' | 'WARN' | 'ERROR',
    event: string,
    message: string,
    data?: unknown,
  ) => void;
}

export interface GridEngineConfig {
  botId: string;
  symbol: string;
  config: GridConfig;
  market: MarketInfo;
  exchange: ExchangePort;
  hooks?: GridEngineHooks;
  /** External pre-trade risk gate (kill switch, exposure, stale price...). */
  preTradeCheck?: (req: PlaceOrderRequest) => Promise<PreTradeResult> | PreTradeResult;
  /** clientOrderId generator (defaults to shared generateClientOrderId). */
  generateOrderId?: (side: OrderSide, levelIndex: number, suffix?: string) => string;
  minNotionalFallback?: string;
  /** Current time provider (overridable for backtests). */
  now?: () => number;
}

export type LifecycleAction =
  | { action: 'PAUSE'; reason: string; cancelOrders: boolean }
  | { action: 'STOP'; reason: string; cancelOrders: boolean };

// ============================================================================
// Grid Engine
// ============================================================================

export class GridEngine extends EventEmitter {
  private readonly cfg: GridEngineConfig;
  private readonly hook: GridEngineHooks;
  private readonly now: () => number;
  private readonly generateOrderId: (side: OrderSide, levelIndex: number, suffix?: string) => string;

  private levels: GridLevelInternal[] = [];
  /** clientOrderId -> owning level (survives order consumption on full fills). */
  private orderLevelIndex = new Map<string, { levelIndex: number; side: OrderSide }>();
  private fees: PortFees = { makerFeeRate: '0.0035', takerFeeRate: '0.0035' };
  private minNotional: Decimal = new Decimal('1');
  private balances: Record<string, Balance> = {};
  private lastDepth?: PortDepth;
  private currentPrice?: Decimal;
  private lastRecenterAt = 0;
  private running = false;
  private initialized = false;

  private totalRealized = new Decimal(0);
  private totalFees = new Decimal(0);
  private totalBuys = 0;
  private totalSells = 0;
  private totalCycles = 0;

  constructor(config: GridEngineConfig) {
    super();
    this.cfg = config;
    this.hook = config.hooks || {};
    this.now = config.now || (() => Date.now());
    this.generateOrderId =
      config.generateOrderId ||
      ((side, levelIndex, suffix) =>
        generateClientOrderId(
          config.botId,
          side === OrderSide.BUY ? 'BUY' : 'SELL',
          levelIndex,
          suffix,
        ));
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  async initialize(): Promise<void> {
    const { config, market, exchange, symbol } = this.cfg;

    try {
      const feeInfo = await exchange.getFees(symbol).catch(() => null);
      if (feeInfo) this.fees = feeInfo;
    } catch {
      /* use defaults */
    }

    const marketMin = market.minNotional
      ? new Decimal(market.minNotional)
      : new Decimal(this.cfg.minNotionalFallback || '1');
    this.minNotional = marketMin;

    this.buildLevels();

    // Validate min profit for adjacent levels
    for (let i = 0; i + 1 < this.levels.length; i++) {
      const res = GridMath.validateMinProfit(
        this.levels[i].price.toString(),
        this.levels[i + 1].price.toString(),
        this.fees.makerFeeRate,
        this.fees.takerFeeRate,
        config.minProfitAfterFeesBps,
      );
      if (!res.valid) {
        this.log('WARN', 'grid.min_profit', `Grid spacing ${i}->${i + 1} below fee-adjusted minimum profit`, {
          message: res.message,
        });
      }
    }

    this.initialized = true;
    this.log('INFO', 'grid.initialized', `Grid initialized with ${this.levels.length} levels`, {
      feeRates: this.fees,
      minNotional: this.minNotional.toString(),
    });
  }

  private buildLevels(): void {
    const { config, market } = this.cfg;
    const generated = GridMath.generateGridLevels(config, market.pricePrecision);

    const previous = new Map(this.levels.map(l => [l.levelIndex, l]));
    this.levels = generated.map(g => {
      const prev = previous.get(g.levelIndex);
      return {
        levelIndex: g.levelIndex,
        price: new Decimal(g.price),
        status: prev?.status ?? GridLevelStatus.IDLE,
        buyOrderId: prev?.buyOrderId,
        sellOrderId: prev?.sellOrderId,
        filledQuantity: prev?.filledQuantity ?? new Decimal(0),
        averageCost: prev?.averageCost,
        realizedProfit: prev?.realizedProfit ?? new Decimal(0),
        skipped: prev?.skipped,
        openSellQuantity: prev?.openSellQuantity ?? new Decimal(0),
        recordedQtyByOrder: prev?.recordedQtyByOrder ?? {},
      };
    });

    this.levels.forEach(l => void this.hook.onLevel?.(this.snapshotLevel(l)));
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  isRunning(): boolean {
    return this.running;
  }

  async start(): Promise<void> {
    if (!this.initialized) await this.initialize();
    this.running = true;
    await this.refreshBalances();
    await this.placeInitialOrders();
    this.emitStats();
  }

  pause(): void {
    this.running = false;
  }

  resume(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  getLevels(): GridLevelState[] {
    return this.levels.map(l => this.snapshotLevel(l));
  }

  getMetrics(): GridMetrics {
    return this.computeMetrics();
  }

  getStateSnapshot(): {
    levels: GridLevelState[];
    metrics: GridMetrics;
    currentPrice?: string;
    running: boolean;
  } {
    return {
      levels: this.getLevels(),
      metrics: this.getMetrics(),
      currentPrice: this.currentPrice?.toString(),
      running: this.running,
    };
  }

  // ==========================================================================
  // Order placement
  // ==========================================================================

  async refreshBalances(): Promise<void> {
    try {
      this.balances = await this.cfg.exchange.getBalances();
    } catch (err) {
      this.log('WARN', 'grid.balances_refresh_failed', String((err as Error)?.message || err));
    }
  }

  /** Quantity for one grid cell in base asset at the given price. */
  private cellQuantity(price: Decimal): { qty: Decimal; skipped?: string } {
    const { config, market } = this.cfg;
    let quotePerCell: Decimal | undefined;

    if (config.quotePerGrid) {
      quotePerCell = new Decimal(config.quotePerGrid);
    } else if (config.totalInvestmentQuote) {
      const buyLevels = Math.max(config.gridCount, 1);
      quotePerCell = new Decimal(config.totalInvestmentQuote).div(buyLevels);
    } else if (config.basePerGrid) {
      const qty = this.roundAmount(new Decimal(config.basePerGrid), market.amountPrecision);
      const notional = qty.times(price);
      if (notional.lt(this.minNotional)) {
        return { qty: new Decimal(0), skipped: `Notional ${notional.toString()} below minimum` };
      }
      return { qty };
    }

    if (!quotePerCell || quotePerCell.lte(0)) {
      return { qty: new Decimal(0), skipped: 'No per-grid amount configured' };
    }

    const qty = this.roundAmount(quotePerCell.div(price), market.amountPrecision);
    const notional = qty.times(price);
    if (qty.lte(0) || notional.lt(this.minNotional)) {
      return { qty: new Decimal(0), skipped: `Notional ${notional.toString()} below minimum ${this.minNotional.toString()}` };
    }
    return { qty };
  }

  private roundAmount(value: Decimal, precision: number): Decimal {
    return value.toDecimalPlaces(precision, Decimal.ROUND_DOWN);
  }

  private roundPrice(value: Decimal): Decimal {
    return value.toDecimalPlaces(this.cfg.market.pricePrecision, Decimal.ROUND_DOWN);
  }

  /** Place initial buy orders on all levels below current price. */
  async placeInitialOrders(): Promise<void> {
    if (!this.currentPrice) {
      this.log('WARN', 'grid.no_price', 'No current price available for initial placement');
      return;
    }
    const price = this.currentPrice;

    for (const level of this.levels) {
      if (!this.running) break;
      if (level.buyOrderId || level.filledQuantity.gt(0)) continue;
      // Only place buys below current price (sell levels are armed after buys fill)
      if (level.price.gte(price)) continue;
      await this.placeBuyForLevel(level, 'initial');
    }
  }

  private async placeBuyForLevel(level: GridLevelInternal, trigger: string): Promise<void> {
    const { symbol, market } = this.cfg;

    const { qty, skipped } = this.cellQuantity(level.price);
    if (skipped || qty.lte(0)) {
      level.skipped = skipped;
      this.log('WARN', 'grid.level_skipped', `Level ${level.levelIndex} skipped: ${skipped}`);
      void this.hook.onLevel?.(this.snapshotLevel(level));
      return;
    }

    // Balance check (quote asset)
    const quoteAsset = market.quoteAsset;
    const available = new Decimal(this.balances[quoteAsset]?.available ?? '0');
    const notional = qty.times(level.price);
    if (available.lt(notional)) {
      level.skipped = `Insufficient ${quoteAsset} balance (${available.toString()} < ${notional.toString()})`;
      if (this.cfg.config.inventoryMode !== 'MANUAL') {
        this.log('WARN', 'grid.insufficient_balance', `Buy level ${level.levelIndex}: ${level.skipped}`);
      }
      void this.hook.onLevel?.(this.snapshotLevel(level));
      return;
    }

    // Maker-only guard
    if (this.cfg.config.makerOnly && this.lastDepth?.bestAsk) {
      if (level.price.gte(new Decimal(this.lastDepth.bestAsk))) {
        // Would cross the spread — defer to next tick
        return;
      }
    }

    const request: PlaceOrderRequest = {
      clientOrderId: this.generateOrderId(OrderSide.BUY, level.levelIndex),
      symbol,
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      price: level.price.toString(),
      quantity: qty.toString(),
    };

    await this.placeOrder(request, level, trigger);
  }

  private async placeSellForLevel(level: GridLevelInternal, trigger: string): Promise<void> {
    const { symbol, market } = this.cfg;

    // Sell at next level price
    const next = this.levels[level.levelIndex + 1];
    if (!next) {
      this.log('INFO', 'grid.top_level', `Level ${level.levelIndex} is top level; no sell armed`);
      return;
    }

    const quantity = this.roundAmount(
      level.filledQuantity.minus(level.openSellQuantity),
      market.amountPrecision,
    );
    if (quantity.lte(0)) return;

    const notional = quantity.times(next.price);
    if (notional.lt(this.minNotional)) {
      this.log('WARN', 'grid.sell_below_min_notional', `Sell at level ${level.levelIndex} below min notional; deferred`);
      return;
    }

    // Balance check (base asset must cover)
    const baseAsset = market.baseAsset;
    const available = new Decimal(this.balances[baseAsset]?.available ?? '0');
    if (available.lt(quantity)) {
      this.log('WARN', 'grid.insufficient_base', `Sell level ${level.levelIndex}: insufficient ${baseAsset} (${available.toString()} < ${quantity.toString()})`);
      return;
    }

    // Maker-only guard
    if (this.cfg.config.makerOnly && this.lastDepth?.bestBid) {
      if (next.price.lte(new Decimal(this.lastDepth.bestBid))) {
        return; // would cross — defer
      }
    }

    const request: PlaceOrderRequest = {
      clientOrderId: this.generateOrderId(OrderSide.SELL, level.levelIndex),
      symbol,
      side: OrderSide.SELL,
      type: OrderType.LIMIT,
      price: next.price.toString(),
      quantity: quantity.toString(),
    };

    const placed = await this.placeOrder(request, level, trigger);
    if (placed) {
      level.openSellQuantity = level.openSellQuantity.plus(quantity);
    }
  }

  private async placeOrder(
    request: PlaceOrderRequest,
    level: GridLevelInternal,
    trigger: string,
  ): Promise<PlacedOrder | undefined> {
    if (!this.running) return undefined;

    // External risk gate (kill switch, stale price, exposure...)
    if (this.cfg.preTradeCheck) {
      const check = await this.cfg.preTradeCheck(request);
      if (!check.ok) {
        this.log('WARN', 'grid.pretrade_blocked', `Order blocked: ${check.reason}`, { request });
        void this.hook.onOrder?.({ action: 'FAILED', request, reason: check.reason });
        return undefined;
      }
    }

    // Max open orders guard
    const maxOpen = this.cfg.config.maxOpenOrders;
    if (maxOpen) {
      const openCount = this.countOpenOrders();
      if (openCount >= maxOpen) {
        this.log('WARN', 'grid.max_open_orders', `Max open orders (${maxOpen}) reached`);
        return undefined;
      }
    }

    try {
      const placed = await this.cfg.exchange.placeOrder(request);
      this.orderLevelIndex.set(request.clientOrderId, {
        levelIndex: level.levelIndex,
        side: request.side,
      });

      // Track locally for balance accounting (locked amounts handled by exchange)
      if (request.side === OrderSide.BUY) {
        const quote = this.balances[this.cfg.market.quoteAsset];
        if (quote) {
          const notional = new Decimal(request.price).times(request.quantity);
          quote.available = new Decimal(quote.available).minus(notional).toString();
          quote.locked = new Decimal(quote.locked).plus(notional).toString();
        }
        level.buyOrderId = request.clientOrderId;
        level.status = GridLevelStatus.BUY_ORDER_OPEN;
        level.skipped = undefined;
      } else {
        const base = this.balances[this.cfg.market.baseAsset];
        if (base) {
          base.available = new Decimal(base.available).minus(request.quantity).toString();
          base.locked = new Decimal(base.locked).plus(request.quantity).toString();
        }
        level.sellOrderId = request.clientOrderId;
        level.status = GridLevelStatus.SELL_ORDER_OPEN;
      }

      void this.hook.onOrder?.({ action: 'PLACE', request, result: placed });
      void this.hook.onLevel?.(this.snapshotLevel(level));
      this.log('INFO', 'grid.order_placed', `${request.side} ${request.quantity} @ ${request.price} (level ${level.levelIndex}, ${trigger})`, {
        clientOrderId: request.clientOrderId,
      });

      // Immediate fill reporting (paper mode or aggressive live orders)
      if (placed.fills && placed.fills.length > 0) {
        this.applyFillToLevel(level, request, placed.fills, false);
      }

      return placed;
    } catch (err) {
      const reason = String((err as Error)?.message || err);
      this.log('ERROR', 'grid.order_failed', `Order placement failed: ${reason}`, { request });
      void this.hook.onOrder?.({ action: 'FAILED', request, reason });
      return undefined;
    }
  }

  private countOpenOrders(): number {
    let count = 0;
    for (const l of this.levels) {
      if (l.buyOrderId) count++;
      if (l.sellOrderId) count++;
    }
    return count;
  }

  // ==========================================================================
  // Market data handling
  // ==========================================================================

  /**
   * Feed a price tick. Drives range checks, SL/TP, recenter/trailing,
   * and retries of deferred maker placements.
   */
  async onPriceTick(price: string, depth?: PortDepth): Promise<void> {
    const priceDec = new Decimal(price);
    const prevPrice = this.currentPrice;
    this.currentPrice = priceDec;
    if (depth) this.lastDepth = depth;

    if (!this.initialized) return;

    // Stop-loss / take-profit (checked even when paused)
    const sl = this.cfg.config.stopLossPrice;
    const tp = this.cfg.config.takeProfitPrice;
    if (sl && priceDec.lte(new Decimal(sl))) {
      await this.triggerLifecycle({ action: 'STOP', reason: 'stop-loss', cancelOrders: true });
      return;
    }
    if (tp && priceDec.gte(new Decimal(tp))) {
      await this.triggerLifecycle({ action: 'STOP', reason: 'take-profit', cancelOrders: true });
      return;
    }

    const { config } = this.cfg;
    const lower = new Decimal(config.lowerPrice);
    const upper = new Decimal(config.upperPrice);
    const inRange = priceDec.gte(lower) && priceDec.lte(upper);

    if (!this.running) return;

    if (!inRange) {
      await this.handleRangeExit(priceDec, lower, upper);
      return;
    }

    // Retry deferred placements (maker-only deferrals, insufficient-balance retries)
    if (prevPrice && !prevPrice.equals(priceDec)) {
      for (const level of this.levels) {
        if (!this.running) break;
        if (level.buyOrderId || level.filledQuantity.gt(0)) continue;
        if (level.price.gte(priceDec)) continue;
        if (level.skipped?.startsWith('Notional') || level.skipped?.startsWith('No per-grid')) continue;
        await this.placeBuyForLevel(level, 'tick-retry');
      }
      for (const level of this.levels) {
        if (!this.running) break;
        if (!level.sellOrderId && level.filledQuantity.gt(0) && level.filledQuantity.gt(level.openSellQuantity)) {
          await this.placeSellForLevel(level, 'tick-retry');
        }
      }
    }

    this.emitStatsThrottled();
  }

  private async handleRangeExit(price: Decimal, lower: Decimal, upper: Decimal): Promise<void> {
    const { config } = this.cfg;

    this.log('WARN', 'grid.range_exit', `Price ${price.toString()} outside range [${config.lowerPrice}, ${config.upperPrice}]`, {
      behavior: config.onRangeExit,
    });

    switch (config.onRangeExit) {
      case 'PAUSE_KEEP_ORDERS':
        await this.triggerLifecycle({ action: 'PAUSE', reason: 'range-exit', cancelOrders: false });
        return;

      case 'PAUSE_CANCEL_ALL':
        await this.triggerLifecycle({ action: 'PAUSE', reason: 'range-exit', cancelOrders: true });
        return;

      case 'STOP_CANCEL_ALL':
        await this.triggerLifecycle({ action: 'STOP', reason: 'range-exit', cancelOrders: true });
        return;

      case 'RECENTER': {
        if (!config.autoRecenter) {
          await this.triggerLifecycle({ action: 'PAUSE', reason: 'range-exit (recenter not auto)', cancelOrders: false });
          return;
        }
        const deviation = price.gt(this.currentUpper())
          ? price.div(this.currentUpper()).minus(1)
          : new Decimal(1).minus(price.div(this.currentLower()));
        const threshold = new Decimal(config.recenterThresholdPercent ?? 1).div(100);
        if (!this.canRecenter() || deviation.lt(threshold)) {
          return; // stay paused-ish; retry on later ticks
        }
        await this.recenter(price);
        return;
      }

      case 'TRAILING': {
        if (!this.canRecenter()) return;
        await this.trail(price, lower, upper);
        return;
      }
    }
  }

  private currentUpper(): Decimal {
    return new Decimal(this.cfg.config.upperPrice);
  }

  private currentLower(): Decimal {
    return new Decimal(this.cfg.config.lowerPrice);
  }

  private canRecenter(): boolean {
    const { config } = this.cfg;
    const cooldownMin = config.recenterCooldownMinutes ?? 30;
    return this.now() - this.lastRecenterAt >= cooldownMin * 60 * 1000;
  }

  /** Cancel all grid orders and rebuild centered on newPrice (same width). */
  async recenter(newPrice: Decimal): Promise<void> {
    const { config } = this.cfg;
    this.log('INFO', 'grid.recenter', `Recentering grid around ${newPrice.toString()}`);

    await this.cancelAllGridOrders('recenter');

    const width = new Decimal(config.upperPrice).minus(config.lowerPrice);
    const newLower = this.roundPrice(newPrice.minus(width.div(2)));
    const newUpper = this.roundPrice(newPrice.plus(width.div(2)));
    if (newLower.lte(0)) {
      this.log('ERROR', 'grid.recenter_invalid', 'Recenter would produce non-positive lower bound');
      return;
    }

    this.cfg.config = { ...config, lowerPrice: newLower.toString(), upperPrice: newUpper.toString() };
    this.lastRecenterAt = this.now();

    this.buildLevels();
    await this.refreshBalances();
    this.running = true;
    await this.placeInitialOrders();
    this.emitStats();
    this.emit('grid.recentered', { lower: newLower.toString(), upper: newUpper.toString() });
  }

  /** TRAILING: shift the entire range by the amount price exited, keep width. */
  private async trail(price: Decimal, lower: Decimal, upper: Decimal): Promise<void> {
    const width = upper.minus(lower);
    let newLower: Decimal;
    if (price.gt(upper)) {
      newLower = price.minus(width);
    } else {
      newLower = price;
    }
    const newUpper = newLower.plus(width);
    if (newLower.lte(0)) return;

    this.log('INFO', 'grid.trailing', `Trailing range to [${newLower.toString()}, ${newUpper.toString()}]`);
    await this.cancelAllGridOrders('trailing');

    this.cfg.config = {
      ...this.cfg.config,
      lowerPrice: this.roundPrice(newLower).toString(),
      upperPrice: this.roundPrice(newUpper).toString(),
    };
    this.lastRecenterAt = this.now();

    this.buildLevels();
    await this.refreshBalances();
    this.running = true;
    await this.placeInitialOrders();
    this.emitStats();
    this.emit('grid.recentered', {
      lower: newLower.toString(),
      upper: newUpper.toString(),
      reason: 'trailing',
    });
  }

  // ==========================================================================
  // Fills
  // ==========================================================================

  /**
   * Handle an order state update from the exchange (WS event or poll).
   * Detects transitions to (PARTIALLY_)FILLED and applies them.
   */
  async handleOrderUpdate(order: PlacedOrder): Promise<void> {
    const level = this.findLevelByOrderId(order.clientOrderId);
    if (!level) return;

    const mapped = this.orderLevelIndex.get(order.clientOrderId);
    const isBuy = (mapped?.side ?? order.side) === OrderSide.BUY;

    if (order.status === OrderStatus.CANCELED || order.status === OrderStatus.REJECTED || order.status === OrderStatus.EXPIRED) {
      if (isBuy) {
        if (level.buyOrderId === order.clientOrderId) level.buyOrderId = undefined;
      } else {
        if (level.sellOrderId === order.clientOrderId) {
          level.sellOrderId = undefined;
          level.openSellQuantity = new Decimal(0);
        }
      }
      if (order.status !== OrderStatus.CANCELED) {
        this.log('WARN', 'grid.order_rejected', `Order ${order.clientOrderId} ${order.status}`);
      }
      void this.hook.onLevel?.(this.snapshotLevel(level));
      return;
    }

    if (!order.fills || order.fills.length === 0) return;

    // Sum not-yet-recorded fills: compare executedQty to what we recorded
    const recordedQty = new Decimal(level.recordedQtyByOrder[order.clientOrderId] || '0');
    const executed = new Decimal(order.executedQty || '0');
    const delta = executed.minus(recordedQty);
    if (delta.lte(0)) return;

    const fillReports = order.fills;
    this.applyFillToLevel(
      level,
      { clientOrderId: order.clientOrderId, side: isBuy ? OrderSide.BUY : OrderSide.SELL } as PlaceOrderRequest,
      fillReports,
      true,
      delta,
      order.quantity ? new Decimal(order.quantity) : undefined,
    );
  }

  /** Apply explicit fill reports (paper exchange trade.detail events). */
  async handleFillReport(
    clientOrderId: string,
    fill: { price: string; quantity: string; fee: string; feeAsset?: string },
  ): Promise<void> {
    const level = this.findLevelByOrderId(clientOrderId);
    if (!level) return;
    const isBuy = level.buyOrderId === clientOrderId;
    this.applyFillToLevel(
      level,
      { clientOrderId, side: isBuy ? OrderSide.BUY : OrderSide.SELL } as PlaceOrderRequest,
      [fill],
      true,
    );
  }

  private applyFillToLevel(
    level: GridLevelInternal,
    request: Pick<PlaceOrderRequest, 'clientOrderId' | 'side'>,
    fills: Array<{ price: string; quantity: string; fee: string; feeAsset?: string }>,
    fromEvent: boolean,
    explicitQty?: Decimal,
    orderTotalQty?: Decimal,
  ): void {
    const isBuy = request.side === OrderSide.BUY;

    // Exchange events repeat ALL fills up to now; skip the portion already
    // recorded for this order and apply at most the new delta.
    const previouslyRecorded = new Decimal(level.recordedQtyByOrder[request.clientOrderId] || '0');
    const maxNew = explicitQty ?? new Decimal(Infinity);

    let skip = previouslyRecorded;
    let qty = new Decimal(0);
    let costQuote = new Decimal(0);
    let feeTotal = new Decimal(0);
    let fillPrice = new Decimal(0);

    for (const f of fills) {
      const fq = new Decimal(f.quantity);
      if (skip.gt(0)) {
        if (skip.gte(fq)) {
          skip = skip.minus(fq);
          continue;
        }
        // Partially skip this fill (defensive; fills are cumulative)
        const skippedPart = skip;
        skip = new Decimal(0);
        const remainingPart = fq.minus(skippedPart);
        const part = Decimal.min(remainingPart, maxNew.minus(qty));
        if (part.lte(0)) break;
        const share = part.div(fq);
        qty = qty.plus(part);
        costQuote = costQuote.plus(part.times(f.price));
        feeTotal = feeTotal.plus(new Decimal(f.fee).times(share));
        fillPrice = new Decimal(f.price);
        continue;
      }

      const part = Decimal.min(fq, maxNew.minus(qty));
      if (part.lte(0)) break;
      const share = part.div(fq);
      qty = qty.plus(part);
      costQuote = costQuote.plus(part.times(f.price));
      // Fee is denominated in feeAsset; normalize to quote for accounting
      if (f.feeAsset && f.feeAsset !== this.cfg.market.quoteAsset && part.gt(0)) {
        feeTotal = feeTotal.plus(new Decimal(f.fee).times(share).times(f.price));
      } else {
        feeTotal = feeTotal.plus(new Decimal(f.fee).times(share));
      }
      fillPrice = new Decimal(f.price);
    }

    if (qty.lte(0)) return;

    // Record executed qty per order to dedupe repeated events
    const recordedAfter = previouslyRecorded.plus(qty);
    level.recordedQtyByOrder[request.clientOrderId] = recordedAfter.toString();

    const avgFillPrice = costQuote.div(qty);
    this.totalFees = this.totalFees.plus(feeTotal);

    const fillEvent: GridFillEvent = {
      clientOrderId: request.clientOrderId,
      levelIndex: level.levelIndex,
      side: isBuy ? OrderSide.BUY : OrderSide.SELL,
      price: avgFillPrice.toString(),
      quantity: qty.toString(),
      fee: feeTotal.toString(),
      feeAsset: fills[0]?.feeAsset,
      isMaker: true,
      timestamp: this.now(),
    };

    // Order fully consumed when its full quantity is recorded (or when a
    // single chunk report arrives without order-total context, e.g. paper).
    const orderConsumed = orderTotalQty ? recordedAfter.gte(orderTotalQty) : true;

    if (isBuy) {
      // Update inventory with average cost (quote, fee-inclusive)
      const prevQty = level.filledQuantity;
      const prevCost = level.averageCost ? level.averageCost.times(prevQty) : new Decimal(0);
      const addedCost = qty.times(avgFillPrice).plus(feeTotal);
      level.filledQuantity = prevQty.plus(qty);
      level.averageCost = level.filledQuantity.gt(0)
        ? prevCost.plus(addedCost).div(level.filledQuantity)
        : undefined;

      if (orderConsumed) {
        level.status = GridLevelStatus.BUY_FILLED;
        if (level.buyOrderId === request.clientOrderId) level.buyOrderId = undefined; // order consumed
      } else {
        level.status = GridLevelStatus.BUY_PARTIALLY_FILLED;
      }

      // Balance accounting: quote spent, base received
      const quote = this.balances[this.cfg.market.quoteAsset];
      if (quote) {
        const spent = qty.times(avgFillPrice);
        quote.locked = Decimal.max(new Decimal(quote.locked).minus(spent), new Decimal(0)).toString();
        quote.total = new Decimal(quote.total).minus(feeTotal).toString();
      }
      const base = this.balances[this.cfg.market.baseAsset];
      if (base) {
        base.available = new Decimal(base.available).plus(qty).toString();
        base.total = new Decimal(base.total).plus(qty).toString();
      }

      this.totalBuys += 1;
      this.log('INFO', 'grid.buy_filled', `Buy filled: ${qty.toString()} @ ${avgFillPrice.toString()} (level ${level.levelIndex})`);
      void this.hook.onFill?.(fillEvent);
      void this.hook.onLevel?.(this.snapshotLevel(level));

      // Arm the opposite sell at the next level
      if (this.running) {
        void this.placeSellForLevel(level, 'buy-fill').then(() => this.emitStats());
      }
    } else {
      // Sell fill: realize profit vs cost basis
      const costBasis = level.averageCost ? level.averageCost.times(qty) : new Decimal(0);
      const proceeds = qty.times(avgFillPrice).minus(feeTotal);
      const realized = proceeds.minus(costBasis);

      level.realizedProfit = level.realizedProfit.plus(realized);
      this.totalRealized = this.totalRealized.plus(realized);
      this.totalSells += 1;
      level.openSellQuantity = Decimal.max(level.openSellQuantity.minus(qty), new Decimal(0));

      const soldFromInventory = Decimal.min(level.filledQuantity, qty);
      level.filledQuantity = level.filledQuantity.minus(soldFromInventory);
      if (level.filledQuantity.lte(0)) {
        level.filledQuantity = new Decimal(0);
        level.averageCost = undefined;
        level.openSellQuantity = new Decimal(0);
        level.status = GridLevelStatus.SELL_FILLED;
        if (level.sellOrderId === request.clientOrderId) level.sellOrderId = undefined;
        this.totalCycles += 1;
      } else {
        level.status = GridLevelStatus.SELL_PARTIALLY_FILLED;
      }

      // Balance accounting: base spent, quote received
      const base = this.balances[this.cfg.market.baseAsset];
      if (base) {
        base.locked = Decimal.max(new Decimal(base.locked).minus(qty), new Decimal(0)).toString();
        base.total = Decimal.max(new Decimal(base.total).minus(qty), new Decimal(0)).toString();
      }
      const quote = this.balances[this.cfg.market.quoteAsset];
      if (quote) {
        quote.available = new Decimal(quote.available).plus(proceeds).toString();
        quote.total = new Decimal(quote.total).plus(proceeds).toString();
      }

      fillEvent.realizedPnL = realized.toFixed(16);
      this.log('INFO', 'grid.sell_filled', `Sell filled: ${qty.toString()} @ ${avgFillPrice.toString()} (level ${level.levelIndex}), realized ${realized.toFixed(8)}`);
      void this.hook.onFill?.(fillEvent);
      void this.hook.onLevel?.(this.snapshotLevel(level));

      // Re-arm the buy at this level to continue the cycle
      if (this.running && this.currentPrice && level.price.lt(this.currentPrice)) {
        void this.placeBuyForLevel(level, 'sell-fill').then(() => this.emitStats());
      } else {
        this.emitStats();
      }
    }

    void fromEvent;
  }

  private findLevelByOrderId(clientOrderId: string): GridLevelInternal | undefined {
    const live = this.levels.find(l => l.buyOrderId === clientOrderId || l.sellOrderId === clientOrderId);
    if (live) return live;
    // Order may already be consumed (full fill applied) — fall back to the placement index.
    const mapped = this.orderLevelIndex.get(clientOrderId);
    if (!mapped) return undefined;
    return this.levels.find(l => l.levelIndex === mapped.levelIndex);
  }

  // ==========================================================================
  // Cancel / lifecycle
  // ==========================================================================

  async cancelAllGridOrders(reason: string): Promise<{ canceled: string[] }> {
    const canceled: string[] = [];

    for (const level of this.levels) {
      for (const id of [level.buyOrderId, level.sellOrderId]) {
        if (!id) continue;
        try {
          await this.cfg.exchange.cancelOrder(id);
          canceled.push(id);
        } catch (err) {
          this.log('WARN', 'grid.cancel_failed', `Cancel failed for ${id}: ${String((err as Error)?.message || err)}`);
        }
      }
      level.buyOrderId = undefined;
      level.sellOrderId = undefined;
      level.openSellQuantity = new Decimal(0);
      if (level.status === GridLevelStatus.BUY_ORDER_OPEN || level.status === GridLevelStatus.SELL_ORDER_OPEN || level.status === GridLevelStatus.BUY_PARTIALLY_FILLED || level.status === GridLevelStatus.SELL_PARTIALLY_FILLED) {
        level.status = level.filledQuantity.gt(0) ? GridLevelStatus.BUY_FILLED : GridLevelStatus.IDLE;
      }
      void this.hook.onLevel?.(this.snapshotLevel(level));
    }

    await this.refreshBalances();
    this.log('INFO', 'grid.cancel_all', `Canceled ${canceled.length} orders (${reason})`);
    return { canceled };
  }

  /** Stop only unknown/foreign behavior is worker-side; this cancels known grid orders. */
  knownOrderIds(): string[] {
    const ids: string[] = [];
    for (const l of this.levels) {
      if (l.buyOrderId) ids.push(l.buyOrderId);
      if (l.sellOrderId) ids.push(l.sellOrderId);
    }
    return ids;
  }

  private lifecyclePending = false;

  private async triggerLifecycle(action: LifecycleAction): Promise<void> {
    if (this.lifecyclePending) return;
    this.lifecyclePending = true;

    this.running = false;
    if (action.cancelOrders) {
      await this.cancelAllGridOrders(action.reason);
    }

    this.log('WARN', 'grid.lifecycle', `${action.action}: ${action.reason}`);
    this.emit('lifecycle', action);
    this.lifecyclePending = false;
  }

  // ==========================================================================
  // Metrics
  // ==========================================================================

  private computeMetrics(): GridMetrics {
    let inventoryBase = new Decimal(0);
    let inventoryCost = new Decimal(0);
    let active = 0;

    for (const l of this.levels) {
      if (l.filledQuantity.gt(0)) {
        inventoryBase = inventoryBase.plus(l.filledQuantity);
        inventoryCost = inventoryCost.plus(l.filledQuantity.times(l.averageCost || l.price));
      }
      if (l.buyOrderId || l.sellOrderId || l.filledQuantity.gt(0)) active++;
    }

    let unrealized = new Decimal(0);
    if (this.currentPrice && inventoryBase.gt(0)) {
      unrealized = inventoryBase.times(this.currentPrice).minus(inventoryCost);
    }

    return {
      totalLevels: this.levels.length,
      activeLevels: active,
      completedCycles: this.totalCycles,
      realizedPnL: this.totalRealized.toFixed(16),
      unrealizedPnL: unrealized.toFixed(16),
      totalFees: this.totalFees.toFixed(16),
      totalBuys: this.totalBuys,
      totalSells: this.totalSells,
      inventoryBase: inventoryBase.toFixed(16),
      inventoryCostQuote: inventoryCost.toFixed(16),
    };
  }

  private lastStatsEmit = 0;

  private emitStatsThrottled(): void {
    const now = this.now();
    if (now - this.lastStatsEmit < 5000) return;
    this.emitStats();
  }

  private emitStats(): void {
    this.lastStatsEmit = this.now();
    const stats = this.computeMetrics();
    this.emit('stats', stats);
    void this.hook.onStats?.(stats);
  }

  // ==========================================================================
  // Internals
  // ==========================================================================

  private snapshotLevel(l: GridLevelInternal): GridLevelState {
    return {
      levelIndex: l.levelIndex,
      price: l.price.toString(),
      status: l.status,
      buyOrderId: l.buyOrderId,
      sellOrderId: l.sellOrderId,
      filledQuantity: l.filledQuantity.toFixed(16),
      averageCost: l.averageCost?.toString(),
      realizedProfit: l.realizedProfit.toFixed(16),
      skipped: l.skipped,
    };
  }

  private log(
    level: 'INFO' | 'WARN' | 'ERROR',
    event: string,
    message: string,
    data?: unknown,
  ): void {
    const line = { botId: this.cfg.botId, event, message, data };
    if (level === 'ERROR') logger.error(line);
    else if (level === 'WARN') logger.warn(line);
    else logger.info(line);
    this.hook.onEvent?.(level, event, message, data);
  }
}

interface GridLevelInternal {
  levelIndex: number;
  price: Decimal;
  status: GridLevelStatus;
  buyOrderId?: string;
  sellOrderId?: string;
  filledQuantity: Decimal;
  averageCost?: Decimal;
  realizedProfit: Decimal;
  skipped?: string;
  openSellQuantity: Decimal;
  /** Executed qty already applied, per clientOrderId (dedupe WS repeats). */
  recordedQtyByOrder: Record<string, string>;
}

export default GridEngine;
