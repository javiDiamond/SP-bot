/**
 * Paper Exchange Simulator
 * 
 * Simulates Wallex exchange for dry-run/paper trading:
 * - Simulated balances
 * - Simulated order placement and matching
 * - Simulated fills based on market price
 * - Fee calculation
 * - Order history tracking
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

    // Initialize balances
    Object.entries(this.config.initialBalances).forEach(([asset, amount]) => {
      const decAmount = new Decimal(amount);
      this.balances.set(asset, {
        asset,
        available: decAmount,
        locked: new Decimal(0),
        total: decAmount,
      });
    });

    logger.info({ balances: this.config.initialBalances }, 'Paper exchange initialized');
  }

  /**
   * Update current market price for a symbol
   */
  updatePrice(symbol: string, price: string): void {
    this.currentPrices.set(symbol, new Decimal(price));
    logger.debug({ symbol, price }, 'Price updated');
  }

  /**
   * Get current price for a symbol
   */
  getPrice(symbol: string): Decimal | undefined {
    return this.currentPrices.get(symbol);
  }

  /**
   * Get balance for an asset
   */
  getBalance(asset: string): PaperBalance | undefined {
    return this.balances.get(asset);
  }

  /**
   * Get all balances
   */
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

  /**
   * Create order
   */
  async createOrder(request: WallexOrderRequest): Promise<WallexOrderResponse> {
    const { symbol, side, type, price, quantity, client_id } = request;

    logger.info({ symbol, side, type, price, quantity, client_id }, 'Creating paper order');

    // Parse values
    const priceDec = new Decimal(price);
    const quantityDec = new Decimal(quantity);
    const notional = priceDec.times(quantityDec);

    // Validate minimum notional
    if (notional.lt(this.config.minNotional)) {
      throw new Error(`Order notional ${notional} below minimum ${this.config.minNotional}`);
    }

    // Check balances
    if (side === 'BUY') {
      const quoteAsset = this.extractQuoteAsset(symbol);
      const balance = this.balances.get(quoteAsset);

      if (!balance || balance.available.lt(notional)) {
        throw new Error(`Insufficient ${quoteAsset} balance`);
      }

      // Lock quote balance
      balance.available = balance.available.minus(notional);
      balance.locked = balance.locked.plus(notional);
    } else {
      const baseAsset = this.extractBaseAsset(symbol);
      const balance = this.balances.get(baseAsset);

      if (!balance || balance.available.lt(quantityDec)) {
        throw new Error(`Insufficient ${baseAsset} balance`);
      }

      // Lock base balance
      balance.available = balance.available.minus(quantityDec);
      balance.locked = balance.locked.plus(quantityDec);
    }

    // Create order
    const orderId = client_id || `PAPER_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
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
    };

    this.orders.set(orderId, order);
    this.emit('order.created', order);

    logger.info({ orderId, status: order.status }, 'Order created');

    // Try to fill immediately if market order or if price crosses current market
    await this.tryFillOrder(order);

    return this.orderToWallexResponse(order);
  }

  /**
   * Cancel order
   */
  async cancelOrder(clientOrderId: string): Promise<WallexOrderResponse> {
    const order = this.orders.get(clientOrderId);

    if (!order) {
      throw new Error(`Order ${clientOrderId} not found`);
    }

    if (order.status === 'FILLED' || order.status === 'CANCELED') {
      throw new Error(`Order cannot be canceled: ${order.status}`);
    }

    logger.info({ clientOrderId }, 'Canceling order');

    // Unlock remaining balance
    const remainingQty = order.quantity.minus(order.executedQty);
    const remainingValue = remainingQty.times(order.price);

    if (order.side === 'BUY') {
      const quoteAsset = this.extractQuoteAsset(order.symbol);
      const balance = this.balances.get(quoteAsset);
      if (balance) {
        balance.locked = balance.locked.minus(remainingValue);
        balance.available = balance.available.plus(remainingValue);
      }
    } else {
      const baseAsset = this.extractBaseAsset(order.symbol);
      const balance = this.balances.get(baseAsset);
      if (balance) {
        balance.locked = balance.locked.minus(remainingQty);
        balance.available = balance.available.plus(remainingQty);
      }
    }

    order.status = 'CANCELED';
    order.updatedAt = Date.now();

    this.emit('order.canceled', order);
    logger.info({ clientOrderId }, 'Order canceled');

    return this.orderToWallexResponse(order);
  }

  /**
   * Get order by client ID
   */
  async getOrder(clientOrderId: string): Promise<WallexOrderResponse> {
    const order = this.orders.get(clientOrderId);

    if (!order) {
      throw new Error(`Order ${clientOrderId} not found`);
    }

    return this.orderToWallexResponse(order);
  }

  /**
   * Get open orders
   */
  async getOpenOrders(symbol?: string): Promise<Record<string, WallexOrderResponse[]>> {
    const openOrders = Array.from(this.orders.values())
      .filter(o => o.status === 'NEW' || o.status === 'PARTIALLY_FILLED');

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

  /**
   * Get fills for an order
   */
  getFills(clientOrderId: string): PaperFill[] {
    return this.fills.filter(f => f.clientOrderId === clientOrderId);
  }

  /**
   * Get all fills
   */
  getAllFills(): PaperFill[] {
    return [...this.fills];
  }

  /**
   * Try to fill an order based on current market price
   */
  private async tryFillOrder(order: PaperOrder): Promise<void> {
    const currentPrice = this.currentPrices.get(order.symbol);

    if (!currentPrice) {
      logger.debug({ orderId: order.clientOrderId }, 'No price available for fill simulation');
      return;
    }

    let shouldFill = false;

    // Determine if order should fill
    if (order.type === 'MARKET') {
      shouldFill = true;
    } else if (order.side === 'BUY' && currentPrice.lte(order.price)) {
      // Buy limit fills if market price <= order price
      shouldFill = true;
    } else if (order.side === 'SELL' && currentPrice.gte(order.price)) {
      // Sell limit fills if market price >= order price
      shouldFill = true;
    }

    if (!shouldFill) {
      return;
    }

    // Calculate fill
    const remainingQty = order.quantity.minus(order.executedQty);
    const fillPrice = order.type === 'MARKET' ? currentPrice : order.price;
    const isMaker = order.type === 'LIMIT' && !order.type.includes('MARKET');
    
    const feeRate = isMaker 
      ? new Decimal(this.config.makerFeeRate)
      : new Decimal(this.config.takerFeeRate);

    // Create fill
    const fill: PaperFill = {
      fillId: `FILL_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      clientOrderId: order.clientOrderId,
      symbol: order.symbol,
      side: order.side,
      price: fillPrice,
      quantity: remainingQty,
      fee: remainingQty.times(fillPrice).times(feeRate),
      feeAsset: this.extractQuoteAsset(order.symbol),
      timestamp: Date.now(),
      isMaker,
    };

    this.fills.push(fill);

    // Update order
    order.executedQty = order.executedQty.plus(remainingQty);
    order.status = order.executedQty.gte(order.quantity) ? 'FILLED' : 'PARTIALLY_FILLED';
    order.updatedAt = Date.now();

    // Update balances
    this.applyFill(fill, order);

    this.emit('order.filled', { order, fill });
    logger.info({ orderId: order.clientOrderId, fillPrice: fillPrice.toString(), quantity: fill.quantity.toString() }, 'Order filled');
  }

  /**
   * Apply fill to balances
   */
  private applyFill(fill: PaperFill, order: PaperOrder): void {
    const fillValue = fill.price.times(fill.quantity);
    const baseAsset = this.extractBaseAsset(order.symbol);
    const quoteAsset = this.extractQuoteAsset(order.symbol);

    if (fill.side === 'BUY') {
      // Buying: spend quote, receive base
      const quoteBalance = this.balances.get(quoteAsset);
      const baseBalance = this.balances.get(baseAsset);

      if (quoteBalance) {
        // Unlock spent quote (minus fees)
        const spentQuote = fillValue.plus(fill.fee);
        quoteBalance.locked = quoteBalance.locked.minus(spentQuote);
      }

      if (baseBalance) {
        // Receive base (minus fees already calculated)
        const receivedBase = fill.quantity.minus(fill.fee.div(fill.price));
        baseBalance.available = baseBalance.available.plus(receivedBase);
        baseBalance.total = baseBalance.total.plus(receivedBase);
      }
    } else {
      // Selling: spend base, receive quote
      const baseBalance = this.balances.get(baseAsset);
      const quoteBalance = this.balances.get(quoteAsset);

      if (baseBalance) {
        // Unlock spent base
        baseBalance.locked = baseBalance.locked.minus(fill.quantity);
        baseBalance.total = baseBalance.total.minus(fill.quantity);
      }

      if (quoteBalance) {
        // Receive quote (minus fees)
        const receivedQuote = fillValue.minus(fill.fee);
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
    // Simple heuristic: first part before USDT or TMN
    const match = symbol.match(/^([A-Z]+)(USDT|TMN|BTC|ETH)$/i);
    return match ? match[1] : symbol.substring(0, 3);
  }

  /**
   * Extract quote asset from symbol (e.g., BTCUSDT -> USDT)
   */
  private extractQuoteAsset(symbol: string): string {
    const match = symbol.match(/^([A-Z]+)(USDT|TMN|BTC|ETH)$/i);
    return match ? match[2] : symbol.substring(3);
  }

  /**
   * Reset paper exchange to initial state
   */
  reset(): void {
    this.orders.clear();
    this.fills = [];
    
    // Reset balances to initial
    this.balances.clear();
    Object.entries(this.config.initialBalances).forEach(([asset, amount]) => {
      const decAmount = new Decimal(amount);
      this.balances.set(asset, {
        asset,
        available: decAmount,
        locked: new Decimal(0),
        total: decAmount,
      });
    });

    logger.info('Paper exchange reset');
  }
}

export default PaperExchange;
