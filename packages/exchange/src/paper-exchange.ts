/**
 * Paper Exchange Simulator
 *
 * Simulates Wallex exchange for dry-run/paper trading:
 * - Simulated balances with locking
 * - Maker-style fills driven by price ticks (updatePrice)
 * - Fee calculation (maker/taker, BUY fee in base asset, SELL fee in quote)
 * - STOP_LIMIT / STOP_MARKET trigger on stop price cross
 * - Order history + fill tracking, event emission
 */

import EventEmitter from 'events';
import Decimal from 'decimal.js';
import pino from 'pino';
import { WallexOrderRequest, WallexOrderResponse, WallexBalance } from './rest-client';

// ============================================================================
// Types
// ============================================================================

export interface PaperBalance {
  asset: string;
  available: Decimal;
  locked: Decimal;
  total: Decimal;
}

export interface PaperOrder {
  clientOrderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET';
  price: Decimal;
  quantity: Decimal;
  executedQty: Decimal;
  status: 'PENDING' | 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED';
  createdAt: number;
  updatedAt: number;
  stopPrice?: Decimal;
  stopTriggered: boolean;
}

export interface PaperFill {
  fillId: string;
  clientOrderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: Decimal;
  quantity: Decimal;
  fee: Decimal;
  feeAsset: string;
  timestamp: number;
  isMaker: boolean;
}

export interface PaperExchangeConfig {
  initialBalances?: Record<string, string>;
  makerFeeRate?: string;
  takerFeeRate?: string;
  minNotional?: string;
}

const QUOTE_ASSETS = ['USDT', 'TMN', 'IRT', 'BTC', 'ETH'];

// ============================================================================
// Logger
// ============================================================================

const logger = pino({ name: 'paper-exchange' });

// ============================================================================
// Paper Exchange
// ============================================================================

export class PaperExchange extends EventEmitter {
  private balances: Map<string, PaperBalance> = new Map();
  private orders: Map<string, PaperOrder> = new Map();
  private fills: PaperFill[] = [];
  private config: Required<PaperExchangeConfig>;
  private currentPrices: Map<string, Decimal> = new Map();

  constructor(config: PaperExchangeConfig = {}) {
    super();

    this.config = {
      initialBalances: config.initialBalances || {
        USDT: '10000',
        TMN: '1000000000',
        BTC: '0',
        ETH: '0',
      },
      makerFeeRate: config.makerFeeRate || '0.0035', // 0.35%
      takerFeeRate: config.takerFeeRate || '0.0035',
      minNotional: config.minNotional || '1',
    };

    this.applyInitialBalances(this.config.initialBalances);

    logger.info({ balances: this.config.initialBalances }, 'Paper exchange initialized');
  }

  private applyInitialBalances(initial: Record<string, string>): void {
    Object.entries(initial).forEach(([asset, amount]) => {
      const decAmount = new Decimal(amount);
      this.balances.set(asset, {
        asset,
        available: decAmount,
        locked: new Decimal(0),
        total: decAmount,
      });
    });
  }

  // ==========================================================================
  // State management
  // ==========================================================================

  /** Replace balances from persisted state (e.g. BalanceSnapshot rows). */
  loadBalances(state: Record<string, { available: string; locked: string }>): void {
    this.balances.clear();
    Object.entries(state).forEach(([asset, b]) => {
      const available = new Decimal(b.available);
      const locked = new Decimal(b.locked);
      this.balances.set(asset, {
        asset,
        available,
        locked,
        total: available.plus(locked),
      });
    });
  }

  /** Snapshot current balances for persistence. */
  snapshotBalances(): Record<string, { available: string; locked: string; total: string }> {
    const out: Record<string, { available: string; locked: string; total: string }> = {};
    this.balances.forEach((b, asset) => {
      out[asset] = {
        available: b.available.toString(),
        locked: b.locked.toString(),
        total: b.total.toString(),
      };
    });
    return out;
  }

  setFeeRates(maker: string, taker: string): void {
    this.config.makerFeeRate = maker;
    this.config.takerFeeRate = taker;
  }

  // ==========================================================================
  // Market data feed
  // ==========================================================================

  /**
   * Update current market price for a symbol.
   * Drives maker fills for resting orders and STOP triggers.
   */
  updatePrice(symbol: string, price: string): void {
    const priceDec = new Decimal(price);
    const prev = this.currentPrices.get(symbol);
    this.currentPrices.set(symbol, priceDec);
    logger.debug({ symbol, price }, 'Price updated');

    this.evaluateOrders(symbol, priceDec, prev);
  }

  /** Evaluate resting orders against a new price tick. */
  private evaluateOrders(symbol: string, price: Decimal, prevPrice?: Decimal): void {
    for (const order of Array.from(this.orders.values())) {
      if (order.symbol !== symbol) continue;
      if (order.status !== 'NEW' && order.status !== 'PARTIALLY_FILLED') continue;

      // STOP trigger handling
      if (
        (order.type === 'STOP_LIMIT' || order.type === 'STOP_MARKET') &&
        !order.stopTriggered &&
        order.stopPrice
      ) {
        const triggered =
          order.side === 'BUY' ? price.gte(order.stopPrice) : price.lte(order.stopPrice);
        if (!triggered) continue;
        order.stopTriggered = true;
        logger.info(
          { clientOrderId: order.clientOrderId, stopPrice: order.stopPrice.toString() },
          'Stop order triggered',
        );
        this.emit('order.update', this.orderToWallexResponse(order));
      }

      if ((order.type === 'STOP_LIMIT' || order.type === 'STOP_MARKET') && !order.stopTriggered) {
        continue;
      }

      this.tryFillOrder(order, price, prevPrice);
    }
  }

  getPrice(symbol: string): Decimal | undefined {
    return this.currentPrices.get(symbol);
  }

  // ==========================================================================
  // Balances
  // ==========================================================================

  getBalance(asset: string): PaperBalance | undefined {
    return this.balances.get(asset);
  }

  getBalances(): Record<string, WallexBalance> {
    const result: Record<string, WallexBalance> = {};

    this.balances.forEach((balance, asset) => {
      result[asset] = {
        asset,
        faName: asset,
        value: balance.total.toString(),
        locked: balance.locked.toString(),
        is_dust: balance.total.lt(1),
        is_digital_gold: false,
      };
    });

    return result;
  }

  // ==========================================================================
  // Orders
  // ==========================================================================

  async createOrder(request: WallexOrderRequest): Promise<WallexOrderResponse> {
    const { symbol, side, type, price, quantity, client_id } = request;

    logger.info({ symbol, side, type, price, quantity, client_id }, 'Creating paper order');

    if (this.orders.has(client_id ?? '')) {
      // Duplicate clientOrderId — idempotent return of existing order
      return this.orderToWallexResponse(this.orders.get(client_id!)!);
    }

    const priceDec = new Decimal(price);
    const quantityDec = new Decimal(quantity);
    const notional = priceDec.times(quantityDec);

    if (notional.lt(this.config.minNotional)) {
      throw new Error(`Order notional ${notional} below minimum ${this.config.minNotional}`);
    }

    if (side === 'BUY') {
      const quoteAsset = this.extractQuoteAsset(symbol);
      const balance = this.balances.get(quoteAsset);

      if (!balance || balance.available.lt(notional)) {
        throw new Error(`Insufficient ${quoteAsset} balance`);
      }

      balance.available = balance.available.minus(notional);
      balance.locked = balance.locked.plus(notional);
    } else {
      const baseAsset = this.extractBaseAsset(symbol);
      const balance = this.balances.get(baseAsset);

      if (!balance || balance.available.lt(quantityDec)) {
        throw new Error(`Insufficient ${baseAsset} balance`);
      }

      balance.available = balance.available.minus(quantityDec);
      balance.locked = balance.locked.plus(quantityDec);
    }

    const orderId =
      client_id || `PAPER_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const order: PaperOrder = {
      clientOrderId: orderId,
      symbol,
      side,
      type,
      price: priceDec,
      quantity: quantityDec,
      executedQty: new Decimal(0),
      status: 'NEW',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      stopPrice: request.stop_Price ? new Decimal(request.stop_Price) : undefined,
      stopTriggered: type === 'LIMIT' || type === 'MARKET',
    };

    this.orders.set(orderId, order);
    this.emit('order.created', order);
    this.emit('order.update', this.orderToWallexResponse(order));

    logger.info({ orderId, status: order.status }, 'Order created');

    // Try to fill immediately if market order or if price crosses current market
    const currentPrice = this.currentPrices.get(symbol);
    if (currentPrice && order.stopTriggered) {
      this.tryFillOrder(order, currentPrice);
    }

    return this.orderToWallexResponse(order);
  }

  async cancelOrder(clientOrderId: string): Promise<WallexOrderResponse> {
    const order = this.orders.get(clientOrderId);

    if (!order) {
      throw new Error(`Order ${clientOrderId} not found`);
    }

    if (order.status === 'FILLED' || order.status === 'CANCELED') {
      throw new Error(`Order cannot be canceled: ${order.status}`);
    }

    logger.info({ clientOrderId }, 'Canceling order');
    this.unlockRemaining(order);

    order.status = 'CANCELED';
    order.updatedAt = Date.now();

    this.emit('order.canceled', order);
    this.emit('order.update', this.orderToWallexResponse(order));
    logger.info({ clientOrderId }, 'Order canceled');

    return this.orderToWallexResponse(order);
  }

  private unlockRemaining(order: PaperOrder): void {
    const remainingQty = order.quantity.minus(order.executedQty);
    const remainingValue = remainingQty.times(order.price);

    if (order.side === 'BUY') {
      const quoteAsset = this.extractQuoteAsset(order.symbol);
      const balance = this.balances.get(quoteAsset);
      if (balance) {
        balance.locked = Decimal.max(balance.locked.minus(remainingValue), new Decimal(0));
        balance.available = balance.available.plus(remainingValue);
      }
    } else {
      const baseAsset = this.extractBaseAsset(order.symbol);
      const balance = this.balances.get(baseAsset);
      if (balance) {
        balance.locked = Decimal.max(balance.locked.minus(remainingQty), new Decimal(0));
        balance.available = balance.available.plus(remainingQty);
      }
    }
  }

  async getOrder(clientOrderId: string): Promise<WallexOrderResponse> {
    const order = this.orders.get(clientOrderId);

    if (!order) {
      throw new Error(`Order ${clientOrderId} not found`);
    }

    return this.orderToWallexResponse(order);
  }

  async getOpenOrders(symbol?: string): Promise<Record<string, WallexOrderResponse[]>> {
    const openOrders = Array.from(this.orders.values()).filter(
      o => o.status === 'NEW' || o.status === 'PARTIALLY_FILLED',
    );

    const result: Record<string, WallexOrderResponse[]> = {};

    openOrders.forEach(order => {
      if (!symbol || order.symbol === symbol) {
        if (!result[order.symbol]) {
          result[order.symbol] = [];
        }
        result[order.symbol].push(this.orderToWallexResponse(order));
      }
    });

    return result;
  }

  getFills(clientOrderId: string): PaperFill[] {
    return this.fills.filter(f => f.clientOrderId === clientOrderId);
  }

  getAllFills(): PaperFill[] {
    return [...this.fills];
  }

  getFillsSince(timestamp: number): PaperFill[] {
    return this.fills.filter(f => f.timestamp >= timestamp);
  }

  // ==========================================================================
  // Fill simulation
  // ==========================================================================

  /**
   * Attempt to fill an order against a market price.
   * Maker model: resting LIMIT BUY fills when tick price <= limit price,
   * resting LIMIT SELL fills when tick price >= limit price.
   * MARKET orders fill at the current tick price.
   */
  private tryFillOrder(order: PaperOrder, marketPrice: Decimal, prevPrice?: Decimal): void {
    let shouldFill = false;
    let fillPrice: Decimal;

    if (order.type === 'MARKET' || order.type === 'STOP_MARKET') {
      shouldFill = true;
      fillPrice = marketPrice;
    } else {
      fillPrice = order.price;
      if (order.side === 'BUY') {
        shouldFill = marketPrice.lte(order.price);
      } else {
        shouldFill = marketPrice.gte(order.price);
      }
    }

    if (!shouldFill) return;

    // Never fill a resting limit below/above the previous tick direction guard
    if (prevPrice && order.type === 'LIMIT' && prevPrice.equals(marketPrice)) {
      // no price movement — nothing new to cross
      return;
    }

    const remainingQty = order.quantity.minus(order.executedQty);
    if (remainingQty.lte(0)) return;

    // Maker if order was resting (price move reached it); taker for market/stop.
    const isMaker = order.type === 'LIMIT';

    const feeRate = isMaker
      ? new Decimal(this.config.makerFeeRate)
      : new Decimal(this.config.takerFeeRate);

    const notional = fillPrice.times(remainingQty);
    const fee = notional.times(feeRate);
    const feeAsset =
      order.side === 'BUY' ? this.extractBaseAsset(order.symbol) : this.extractQuoteAsset(order.symbol);

    const fill: PaperFill = {
      fillId: `FILL_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      clientOrderId: order.clientOrderId,
      symbol: order.symbol,
      side: order.side,
      price: fillPrice,
      quantity: remainingQty,
      fee: order.side === 'BUY' ? fee.div(fillPrice) : fee, // BUY fee denominated in base asset
      feeAsset,
      timestamp: Date.now(),
      isMaker,
    };

    this.fills.push(fill);

    order.executedQty = order.executedQty.plus(remainingQty);
    order.status = order.executedQty.gte(order.quantity) ? 'FILLED' : 'PARTIALLY_FILLED';
    order.updatedAt = Date.now();

    this.applyFill(fill, order);

    this.emit('order.filled', { order, fill });
    this.emit('order.update', this.orderToWallexResponse(order));
    this.emit('trade.detail', {
      clientOrderId: order.clientOrderId,
      symbol: order.symbol,
      side: order.side,
      price: fill.price.toString(),
      quantity: fill.quantity.toString(),
      fee: fill.fee.toString(),
      feeAsset: fill.feeAsset,
      timestamp: fill.timestamp,
    });

    logger.info(
      {
        orderId: order.clientOrderId,
        fillPrice: fillPrice.toString(),
        quantity: fill.quantity.toString(),
        fee: fill.fee.toString(),
      },
      'Order filled',
    );
  }

  /**
   * Apply fill to balances.
   * BUY: locked quote (locked at limit price) reduced by fill notional,
   *      surplus vs limit price returned to available; fee deducted from received base.
   * SELL: locked base reduced and burned; proceeds credited minus quote fee.
   */
  private applyFill(fill: PaperFill, order: PaperOrder): void {
    const fillNotional = fill.price.times(fill.quantity);
    const baseAsset = this.extractBaseAsset(order.symbol);
    const quoteAsset = this.extractQuoteAsset(order.symbol);

    if (fill.side === 'BUY') {
      const quoteBalance = this.balances.get(quoteAsset);
      const baseBalance = this.balances.get(baseAsset);

      if (quoteBalance) {
        // Quote was locked at order.price * qty; settle at actual fillPrice.
        const lockedAmount = order.price.times(fill.quantity);
        quoteBalance.locked = Decimal.max(quoteBalance.locked.minus(lockedAmount), new Decimal(0));
        const surplus = lockedAmount.minus(fillNotional);
        if (surplus.gt(0)) {
          quoteBalance.available = quoteBalance.available.plus(surplus);
        }
      }

      if (baseBalance) {
        // Receive base minus base-denominated fee
        const receivedBase = fill.quantity.minus(fill.fee);
        baseBalance.available = baseBalance.available.plus(receivedBase);
        baseBalance.total = baseBalance.total.plus(receivedBase);
      }
    } else {
      const baseBalance = this.balances.get(baseAsset);
      const quoteBalance = this.balances.get(quoteAsset);

      if (baseBalance) {
        baseBalance.locked = Decimal.max(baseBalance.locked.minus(fill.quantity), new Decimal(0));
        baseBalance.total = baseBalance.total.minus(fill.quantity);
      }

      if (quoteBalance) {
        const receivedQuote = fillNotional.minus(fill.fee);
        quoteBalance.available = quoteBalance.available.plus(receivedQuote);
        quoteBalance.total = quoteBalance.total.plus(receivedQuote);
      }
    }
  }

  /**
   * Convert paper order to Wallex response format
   */
  private orderToWallexResponse(order: PaperOrder): WallexOrderResponse {
    return {
      symbol: order.symbol,
      side: order.side,
      clientOrderId: order.clientOrderId,
      price: order.price.toString(),
      origQty: order.quantity.toString(),
      executedQty: order.executedQty.toString(),
      status: order.status,
      active: order.status === 'NEW' || order.status === 'PARTIALLY_FILLED',
      transactTime: order.createdAt,
      fills: this.getFills(order.clientOrderId).map(f => ({
        price: f.price.toString(),
        quantity: f.quantity.toString(),
        fee: f.fee.toString(),
        feeAsset: f.feeAsset,
      })),
    };
  }

  /**
   * Extract base asset from symbol (e.g., BTCUSDT -> BTC)
   */
  private extractBaseAsset(symbol: string): string {
    const upper = symbol.toUpperCase();
    for (const quote of QUOTE_ASSETS) {
      if (upper.endsWith(quote) && upper.length > quote.length) {
        return upper.slice(0, upper.length - quote.length);
      }
    }
    return upper.substring(0, 3);
  }

  /**
   * Extract quote asset from symbol (e.g., BTCUSDT -> USDT)
   */
  private extractQuoteAsset(symbol: string): string {
    const upper = symbol.toUpperCase();
    for (const quote of QUOTE_ASSETS) {
      if (upper.endsWith(quote) && upper.length > quote.length) {
        return quote;
      }
    }
    return upper.substring(3);
  }

  /**
   * Reset paper exchange to initial state
   */
  reset(): void {
    this.orders.clear();
    this.fills = [];

    this.balances.clear();
    this.applyInitialBalances(this.config.initialBalances);

    logger.info('Paper exchange reset');
  }
}

export default PaperExchange;
