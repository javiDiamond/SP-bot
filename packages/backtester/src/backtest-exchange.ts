/**
 * Backtest Exchange Port
 *
 * A deterministic, candle-driven ExchangePort used to run the shared
 * GridEngine in backtests. It owns balances/orders/fills and exposes a
 * synchronous snapshot of resting orders so the backtester can apply
 * conservative same-candle fill ordering.
 */

import Decimal from 'decimal.js';
import {
  Balance,
  ExchangePort,
  MarketInfo,
  OrderSide,
  OrderStatus,
  OrderType,
  PlaceOrderRequest,
  PlacedOrder,
  PortFees,
  TradingMode,
} from '@wallex/shared';

export interface BacktestPortfolio {
  available: Record<string, Decimal>;
  locked: Record<string, Decimal>;
  total: Record<string, Decimal>;
}

interface BacktestOrder {
  clientOrderId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: Decimal;
  quantity: Decimal;
  executedQty: Decimal;
  status: OrderStatus;
}

export interface BacktestFillRecord {
  clientOrderId: string;
  side: OrderSide;
  price: string;
  quantity: string;
  fee: string;
  feeAsset: string;
  timestamp: number;
}

export interface BacktestExchangePortConfig {
  symbol: string;
  market: MarketInfo;
  initialBalances: Record<string, string>;
  makerFeeRate: string;
  takerFeeRate: string;
}

export class BacktestExchangePort implements ExchangePort {
  readonly mode = TradingMode.DRY_RUN;
  private readonly cfg: BacktestExchangePortConfig;
  private readonly portfolio: BacktestPortfolio = {
    available: {},
    locked: {},
    total: {},
  };
  private orders = new Map<string, BacktestOrder>();
  private fills: BacktestFillRecord[] = [];
  private lastPrice = new Decimal(0);

  constructor(config: BacktestExchangePortConfig) {
    this.cfg = config;
    for (const [asset, amount] of Object.entries(config.initialBalances)) {
      const amt = new Decimal(amount);
      this.portfolio.available[asset] = amt;
      this.portfolio.locked[asset] = new Decimal(0);
      this.portfolio.total[asset] = amt;
    }
  }

  setLastPrice(price: string): void {
    this.lastPrice = new Decimal(price);
  }

  getPortfolio(): BacktestPortfolio {
    return this.portfolio;
  }

  // ==========================================================================
  // ExchangePort
  // ==========================================================================

  async getMarket(_symbol: string): Promise<MarketInfo> {
    return this.cfg.market;
  }

  async getBalances(): Promise<Record<string, Balance>> {
    const out: Record<string, Balance> = {};
    for (const asset of Object.keys(this.portfolio.total)) {
      out[asset] = {
        asset,
        available: this.portfolio.available[asset]?.toString() ?? '0',
        locked: this.portfolio.locked[asset]?.toString() ?? '0',
        total: this.portfolio.total[asset]?.toString() ?? '0',
      };
    }
    return out;
  }

  async getFees(_symbol: string): Promise<PortFees> {
    return {
      makerFeeRate: this.cfg.makerFeeRate,
      takerFeeRate: this.cfg.takerFeeRate,
    };
  }

  async getDepth(_symbol: string): Promise<{ bestBid?: string; bestAsk?: string }> {
    const p = this.lastPrice.toString();
    return { bestBid: p, bestAsk: p };
  }

  async placeOrder(req: PlaceOrderRequest): Promise<PlacedOrder> {
    const price = new Decimal(req.price);
    const quantity = new Decimal(req.quantity);

    if (req.side === OrderSide.BUY) {
      const quote = this.cfg.market.quoteAsset;
      const notional = price.times(quantity);
      const avail = this.portfolio.available[quote] ?? new Decimal(0);
      if (avail.lt(notional)) {
        throw new Error(`Backtest insufficient ${quote} balance`);
      }
      this.portfolio.available[quote] = avail.minus(notional);
      this.portfolio.locked[quote] = (this.portfolio.locked[quote] ?? new Decimal(0)).plus(notional);
    } else {
      const base = this.cfg.market.baseAsset;
      const avail = this.portfolio.available[base] ?? new Decimal(0);
      if (avail.lt(quantity)) {
        throw new Error(`Backtest insufficient ${base} balance`);
      }
      this.portfolio.available[base] = avail.minus(quantity);
      this.portfolio.locked[base] = (this.portfolio.locked[base] ?? new Decimal(0)).plus(quantity);
    }

    const order: BacktestOrder = {
      clientOrderId: req.clientOrderId,
      symbol: req.symbol,
      side: req.side,
      type: req.type,
      price,
      quantity,
      executedQty: new Decimal(0),
      status: OrderStatus.NEW,
    };
    this.orders.set(req.clientOrderId, order);

    return this.toPlaced(order);
  }

  async cancelOrder(clientOrderId: string): Promise<{
    clientOrderId: string;
    status: 'CANCELED' | 'NOT_FOUND';
  }> {
    const order = this.orders.get(clientOrderId);
    if (!order) return { clientOrderId, status: 'NOT_FOUND' };
    if (order.status === OrderStatus.FILLED || order.status === OrderStatus.CANCELED) {
      return { clientOrderId, status: 'NOT_FOUND' };
    }

    const remaining = order.quantity.minus(order.executedQty);
    this.unlock(order, remaining);
    order.status = OrderStatus.CANCELED;
    return { clientOrderId, status: 'CANCELED' };
  }

  async getOpenOrders(symbol: string): Promise<PlacedOrder[]> {
    const out: PlacedOrder[] = [];
    for (const order of this.orders.values()) {
      if (order.symbol !== symbol) continue;
      if (order.status === OrderStatus.NEW || order.status === OrderStatus.PARTIALLY_FILLED) {
        out.push(this.toPlaced(order));
      }
    }
    return out;
  }

  async getFillsSince(symbol: string, sinceTs: number): Promise<PlacedOrder[]> {
    void symbol;
    const recent = this.fills.filter(f => f.timestamp >= sinceTs);
    return recent.map(f => {
      const order = this.orders.get(f.clientOrderId);
      return this.toPlaced(order, [
        { price: f.price, quantity: f.quantity, fee: f.fee, feeAsset: f.feeAsset },
      ]);
    });
  }

  on(_event: 'order.update' | 'trade.detail', _cb: (e: unknown) => void): void {
    // Backtester drives the engine synchronously; no event wiring needed.
  }

  // ==========================================================================
  // Backtest-specific
  // ==========================================================================

  /** Synchronous snapshot of resting orders for same-candle fill decisions. */
  restingOrders(symbol: string): Array<{ clientOrderId: string; side: OrderSide; price: Decimal; quantity: Decimal }> {
    const out: Array<{ clientOrderId: string; side: OrderSide; price: Decimal; quantity: Decimal }> = [];
    for (const order of this.orders.values()) {
      if (order.symbol !== symbol) continue;
      if (order.status === OrderStatus.NEW || order.status === OrderStatus.PARTIALLY_FILLED) {
        out.push({
          clientOrderId: order.clientOrderId,
          side: order.side,
          price: order.price,
          quantity: order.quantity.minus(order.executedQty),
        });
      }
    }
    return out;
  }

  /**
   * Apply a fill to a resting order (driven by candle high/low crossing the
   * limit price). Fee is supplied in quote asset.
   */
  applyFill(
    clientOrderId: string,
    fillPrice: string,
    fillQty: string,
    fee: string,
    timestamp: number,
  ): BacktestFillRecord | null {
    const order = this.orders.get(clientOrderId);
    if (!order) return null;

    const price = new Decimal(fillPrice);
    const qty = new Decimal(fillQty);
    const feeDec = new Decimal(fee);

    const base = this.cfg.market.baseAsset;
    const quote = this.cfg.market.quoteAsset;

    if (order.side === OrderSide.BUY) {
      const notional = price.times(qty);
      const lockedQuote = this.portfolio.locked[quote] ?? new Decimal(0);
      // Release the quote that was locked at the (limit) order price.
      const release = order.price.times(qty);
      this.portfolio.locked[quote] = Decimal.max(lockedQuote.minus(release), new Decimal(0));
      this.portfolio.total[quote] = (this.portfolio.total[quote] ?? new Decimal(0)).minus(notional).minus(feeDec);
      this.portfolio.available[base] = (this.portfolio.available[base] ?? new Decimal(0)).plus(qty);
      this.portfolio.total[base] = (this.portfolio.total[base] ?? new Decimal(0)).plus(qty);
    } else {
      const lockedBase = this.portfolio.locked[base] ?? new Decimal(0);
      this.portfolio.locked[base] = Decimal.max(lockedBase.minus(qty), new Decimal(0));
      this.portfolio.total[base] = (this.portfolio.total[base] ?? new Decimal(0)).minus(qty);
      const proceeds = price.times(qty).minus(feeDec);
      this.portfolio.available[quote] = (this.portfolio.available[quote] ?? new Decimal(0)).plus(proceeds);
      this.portfolio.total[quote] = (this.portfolio.total[quote] ?? new Decimal(0)).plus(proceeds);
    }

    order.executedQty = order.executedQty.plus(qty);
    order.status = order.executedQty.gte(order.quantity) ? OrderStatus.FILLED : OrderStatus.PARTIALLY_FILLED;

    const record: BacktestFillRecord = {
      clientOrderId,
      side: order.side,
      price: price.toString(),
      quantity: qty.toString(),
      fee: feeDec.toString(),
      feeAsset: quote,
      timestamp,
    };
    this.fills.push(record);
    return record;
  }

  allFills(): BacktestFillRecord[] {
    return [...this.fills];
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private unlock(order: BacktestOrder, remaining: Decimal): void {
    const base = this.cfg.market.baseAsset;
    const quote = this.cfg.market.quoteAsset;
    if (order.side === OrderSide.BUY) {
      const value = remaining.times(order.price);
      this.portfolio.locked[quote] = Decimal.max(
        (this.portfolio.locked[quote] ?? new Decimal(0)).minus(value),
        new Decimal(0),
      );
      this.portfolio.available[quote] = (this.portfolio.available[quote] ?? new Decimal(0)).plus(value);
    } else {
      this.portfolio.locked[base] = Decimal.max(
        (this.portfolio.locked[base] ?? new Decimal(0)).minus(remaining),
        new Decimal(0),
      );
      this.portfolio.available[base] = (this.portfolio.available[base] ?? new Decimal(0)).plus(remaining);
    }
  }

  private toPlaced(
    order?: BacktestOrder,
    fills?: Array<{ price: string; quantity: string; fee: string; feeAsset: string }>,
  ): PlacedOrder {
    if (!order) {
      return {
        clientOrderId: '',
        symbol: this.cfg.symbol,
        side: OrderSide.BUY,
        type: OrderType.LIMIT,
        status: OrderStatus.UNKNOWN,
        price: '0',
        quantity: '0',
        executedQty: '0',
      };
    }
    return {
      clientOrderId: order.clientOrderId,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      status: order.status,
      price: order.price.toString(),
      quantity: order.quantity.toString(),
      executedQty: order.executedQty.toString(),
      fills,
    };
  }
}
