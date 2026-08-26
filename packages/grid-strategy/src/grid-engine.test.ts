/**
 * GridEngine lifecycle tests against a fake ExchangePort.
 *
 * Covers: initial placement, buy→sell pairing, sell→buy re-arm,
 * partial fills and WS-repeat dedupe, pre-trade risk gate (kill switch),
 * balance guards, range-exit and stop-loss behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import Decimal from 'decimal.js';
import {
  Balance,
  ExchangePort,
  GridConfig,
  GridLevelStatus,
  GridType,
  MarketInfo,
  OrderSide,
  OrderStatus,
  OrderType,
  PlacedOrder,
  PlaceOrderRequest,
  PortDepth,
  PortFees,
  TradingMode,
} from '@wallex/shared';
import { GridEngine, GridEngineHooks } from './grid-engine';

// ============================================================================
// Fake exchange port
// ============================================================================

class FakeExchange implements ExchangePort {
  mode = TradingMode.DRY_RUN;
  placed: PlaceOrderRequest[] = [];
  canceled: string[] = [];
  placeShouldFail = false;
  balances: Record<string, Balance> = {};

  constructor(balances: Record<string, Balance>) {
    this.balances = balances;
  }

  async getMarket(symbol: string): Promise<MarketInfo> {
    return makeMarket(symbol);
  }
  async getBalances(): Promise<Record<string, Balance>> {
    return this.balances;
  }
  async getFees(_symbol: string): Promise<PortFees> {
    return { makerFeeRate: '0.001', takerFeeRate: '0.001' };
  }
  async getDepth(_symbol: string): Promise<PortDepth> {
    return { bestBid: '149.9', bestAsk: '150.1' };
  }
  async placeOrder(req: PlaceOrderRequest): Promise<PlacedOrder> {
    if (this.placeShouldFail) throw new Error('exchange unavailable');
    this.placed.push(req);
    return {
      clientOrderId: req.clientOrderId,
      symbol: req.symbol,
      side: req.side,
      type: req.type,
      status: OrderStatus.NEW,
      price: req.price,
      quantity: req.quantity,
      executedQty: '0',
    };
  }
  async cancelOrder(clientOrderId: string): Promise<{ clientOrderId: string; status: 'CANCELED' }> {
    this.canceled.push(clientOrderId);
    return { clientOrderId, status: 'CANCELED' };
  }
  async getOpenOrders(_symbol: string): Promise<PlacedOrder[]> {
    return [];
  }
  async getFillsSince(_symbol: string, _sinceTs: number): Promise<PlacedOrder[]> {
    return [];
  }
  on(_event: 'order.update' | 'trade.detail', _cb: (e: unknown) => void): void {}

  buys(): PlaceOrderRequest[] {
    return this.placed.filter(p => p.side === OrderSide.BUY);
  }
  sells(): PlaceOrderRequest[] {
    return this.placed.filter(p => p.side === OrderSide.SELL);
  }
  lastOrderId(): string {
    return this.placed[this.placed.length - 1].clientOrderId;
  }
}

// ============================================================================
// Fixtures
// ============================================================================

function makeMarket(symbol = 'BTCUSDT'): MarketInfo {
  return {
    symbol,
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    isSpot: true,
    pricePrecision: 2,
    amountPrecision: 6,
    minNotional: '1',
  };
}

function makeConfig(over: Partial<GridConfig> = {}): GridConfig {
  return {
    gridType: GridType.ARITHMETIC,
    lowerPrice: '100',
    upperPrice: '200',
    gridCount: 4, // levels: 100, 125, 150, 175, 200
    quotePerGrid: '1000',
    inventoryMode: 'AUTO_REBALANCE',
    makerOnly: false,
    minProfitAfterFeesBps: 10,
    onRangeExit: 'PAUSE_KEEP_ORDERS',
    autoRecenter: false,
    allowMarketOrders: false,
    ...over,
  };
}

function makeEngine(over: {
  config?: Partial<GridConfig>;
  balances?: Record<string, Balance>;
  preTradeCheck?: (req: PlaceOrderRequest) => { ok: boolean; reason?: string };
  hooks?: GridEngineHooks;
  now?: () => number;
}): { engine: GridEngine; exchange: FakeExchange } {
  const exchange = new FakeExchange(
    over.balances ?? {
      USDT: { asset: 'USDT', total: '100000', available: '100000', locked: '0' },
      BTC: { asset: 'BTC', total: '0', available: '0', locked: '0' },
    },
  );
  const engine = new GridEngine({
    botId: 'bot-1',
    symbol: 'BTCUSDT',
    config: makeConfig(over.config),
    market: makeMarket(),
    exchange,
    preTradeCheck: over.preTradeCheck,
    hooks: over.hooks,
    now: over.now,
  });
  return { engine, exchange };
}

const flush = () => new Promise<void>(r => setTimeout(r, 0));

// ============================================================================
// Tests
// ============================================================================

describe('GridEngine initialization and placement', () => {
  it('places buy orders only on levels strictly below the current price', async () => {
    const { engine, exchange } = makeEngine({});
    await engine.initialize();
    await engine.onPriceTick('150');
    await engine.start();

    // Levels below 150: 100 and 125 (150 itself is excluded)
    expect(exchange.buys().map(b => b.price)).toEqual(['100', '125']);
    expect(exchange.buys()[0].quantity).toBe('10'); // 1000 / 100
    expect(exchange.buys()[1].quantity).toBe('8'); // 1000 / 125
    expect(engine.isRunning()).toBe(true);

    const levels = engine.getLevels();
    expect(levels.map(l => l.price)).toEqual(['100', '125', '150', '175', '200']);
    expect(levels[0].status).toBe(GridLevelStatus.BUY_ORDER_OPEN);
    expect(levels[2].status).toBe(GridLevelStatus.IDLE);
  });

  it('skips levels when quote balance is insufficient', async () => {
    const { engine, exchange } = makeEngine({
      balances: {
        USDT: { asset: 'USDT', total: '1500', available: '1500', locked: '0' },
        BTC: { asset: 'BTC', total: '0', available: '0', locked: '0' },
      },
    });
    await engine.initialize();
    await engine.onPriceTick('150');
    await engine.start();

    // First buy (notional 1000) fits, second does not (500 remaining < 1000)
    expect(exchange.buys()).toHaveLength(1);
    const level0 = engine.getLevels()[0];
    expect(level0.buyOrderId).toBeTruthy();
    const level1 = engine.getLevels()[1];
    expect(level1.skipped).toMatch(/Insufficient USDT/);
  });

  it('honours maxOpenOrders', async () => {
    const { engine, exchange } = makeEngine({ config: { maxOpenOrders: 1 } });
    await engine.initialize();
    await engine.onPriceTick('150');
    await engine.start();
    expect(exchange.placed).toHaveLength(1);
  });

  it('blocks placement through the pre-trade risk gate (kill switch)', async () => {
    const failed: Array<{ reason?: string }> = [];
    const { engine, exchange } = makeEngine({
      preTradeCheck: () => ({ ok: false, reason: 'kill switch active' }),
      hooks: {
        onOrder: e => {
          if (e.action === 'FAILED') failed.push({ reason: e.reason });
        },
      },
    });

    await engine.initialize();
    await engine.onPriceTick('150');
    await engine.start();

    expect(exchange.placed).toHaveLength(0);
    expect(failed.some(f => f.reason === 'kill switch active')).toBe(true);
  });

  it('records exchange failures as FAILED orders without crashing', async () => {
    const { engine, exchange } = makeEngine({});
    exchange.placeShouldFail = true;
    await engine.initialize();
    await engine.onPriceTick('150');
    await engine.start();
    expect(engine.getLevels().every(l => l.status === GridLevelStatus.IDLE)).toBe(true);
  });
});

describe('GridEngine fill pairing', () => {
  let engine: GridEngine;
  let exchange: FakeExchange;
  let buyOrderId: string;

  beforeEach(async () => {
    ({ engine, exchange } = makeEngine({}));
    await engine.initialize();
    await engine.onPriceTick('150');
    await engine.start();
    buyOrderId = exchange.buys().find(b => b.price === '125')!.clientOrderId;
  });

  it('buy fill arms a sell at the next grid level for the filled quantity', async () => {
    await engine.handleFillReport(buyOrderId, { price: '125', quantity: '8', fee: '1' });
    await flush();

    const sells = exchange.sells();
    expect(sells).toHaveLength(1);
    expect(sells[0].price).toBe('150'); // next level above 125
    expect(sells[0].quantity).toBe('8');
    expect(sells[0].side).toBe(OrderSide.SELL);

    const level = engine.getLevels().find(l => l.levelIndex === 1)!;
    expect(level.status).toBe(GridLevelStatus.SELL_ORDER_OPEN);
    expect(new Decimal(level.filledQuantity).toString()).toBe('8');
  });

  it('sell fill realizes profit, completes a cycle and re-arms the buy', async () => {
    await engine.handleFillReport(buyOrderId, { price: '125', quantity: '8', fee: '1' });
    await flush();

    const sellOrderId = exchange.sells()[0].clientOrderId;
    await engine.handleFillReport(sellOrderId, { price: '150', quantity: '8', fee: '1.2' });
    await flush();

    const metrics = engine.getMetrics();
    expect(metrics.completedCycles).toBe(1);
    expect(metrics.totalBuys).toBe(1);
    expect(metrics.totalSells).toBe(1);
    // realized = 8*150 - 1.2 - (8*125 + 1) = 197.8
    expect(new Decimal(metrics.realizedPnL).toDecimalPlaces(4).toString()).toBe('197.8');
    expect(new Decimal(metrics.totalFees).toDecimalPlaces(4).toString()).toBe('2.2');
    expect(new Decimal(metrics.inventoryBase).isZero()).toBe(true);

    // Buy re-armed at the same level (125 < current 150)
    const buysAt125 = exchange.buys().filter(b => b.price === '125');
    expect(buysAt125).toHaveLength(2);

    const level = engine.getLevels().find(l => l.levelIndex === 1)!;
    expect(level.status).toBe(GridLevelStatus.BUY_ORDER_OPEN);
    expect(new Decimal(level.filledQuantity).isZero()).toBe(true);
    expect(new Decimal(level.realizedProfit).toDecimalPlaces(4).toString()).toBe('197.8');
  });

  it('handles partial fills without double counting WS repeats', async () => {
    await engine.handleOrderUpdate({
      clientOrderId: buyOrderId,
      symbol: 'BTCUSDT',
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      status: OrderStatus.PARTIALLY_FILLED,
      price: '125',
      quantity: '8',
      executedQty: '3',
      fills: [{ price: '125', quantity: '3', fee: '0.375' }],
    });
    await flush();

    let level = engine.getLevels().find(l => l.levelIndex === 1)!;
    expect(new Decimal(level.filledQuantity).toString()).toBe('3');
    expect(level.buyOrderId).toBe(buyOrderId); // still open for the remainder
    // Partial inventory already arms a sell for the filled part (status moves to the armed sell)
    expect(exchange.sells().map(s => s.quantity)).toEqual(['3']);

    // Repeat of the same event (cumulative fills, no new executed delta) — must be ignored
    await engine.handleOrderUpdate({
      clientOrderId: buyOrderId,
      symbol: 'BTCUSDT',
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      status: OrderStatus.PARTIALLY_FILLED,
      price: '125',
      quantity: '8',
      executedQty: '3',
      fills: [{ price: '125', quantity: '3', fee: '0.375' }],
    });
    await flush();

    level = engine.getLevels().find(l => l.levelIndex === 1)!;
    expect(new Decimal(level.filledQuantity).toString()).toBe('3');
    expect(engine.getMetrics().totalBuys).toBe(1);
    expect(new Decimal(engine.getMetrics().totalFees).toDecimalPlaces(4).toString()).toBe('0.375');

    // Final chunk: event carries ALL fills; only the unrecorded delta applies
    await engine.handleOrderUpdate({
      clientOrderId: buyOrderId,
      symbol: 'BTCUSDT',
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      status: OrderStatus.FILLED,
      price: '125',
      quantity: '8',
      executedQty: '8',
      fills: [
        { price: '125', quantity: '3', fee: '0.375' },
        { price: '125', quantity: '5', fee: '0.625' },
      ],
    });
    await flush();

    level = engine.getLevels().find(l => l.levelIndex === 1)!;
    expect(new Decimal(level.filledQuantity).toString()).toBe('8');
    // Remainder armed as a second sell; fees not double counted
    expect(exchange.sells().map(s => s.quantity)).toEqual(['3', '5']);
    const metrics = engine.getMetrics();
    expect(metrics.totalBuys).toBe(2);
    expect(new Decimal(metrics.totalFees).toDecimalPlaces(4).toString()).toBe('1');
  });

  it('clears order ids on cancel without touching inventory', async () => {
    await engine.handleOrderUpdate({
      clientOrderId: buyOrderId,
      symbol: 'BTCUSDT',
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      status: OrderStatus.CANCELED,
      price: '125',
      quantity: '8',
      executedQty: '0',
    });

    const level = engine.getLevels().find(l => l.levelIndex === 1)!;
    expect(level.buyOrderId).toBeUndefined();
    expect(new Decimal(level.filledQuantity).isZero()).toBe(true);
  });
});

describe('GridEngine range exit and protection', () => {
  it('STOP_CANCEL_ALL stops the engine and cancels open orders on range exit', async () => {
    const { engine, exchange } = makeEngine({ config: { onRangeExit: 'STOP_CANCEL_ALL' } });
    await engine.initialize();
    await engine.onPriceTick('150');
    await engine.start();
    expect(exchange.buys()).toHaveLength(2);

    const lifecycle: unknown[] = [];
    engine.on('lifecycle', a => lifecycle.push(a));

    await engine.onPriceTick('205');

    expect(engine.isRunning()).toBe(false);
    expect(exchange.canceled).toHaveLength(2);
    expect(lifecycle).toHaveLength(1);
    expect((lifecycle[0] as { action: string }).action).toBe('STOP');
  });

  it('PAUSE_KEEP_ORDERS pauses without canceling', async () => {
    const { engine, exchange } = makeEngine({ config: { onRangeExit: 'PAUSE_KEEP_ORDERS' } });
    await engine.initialize();
    await engine.onPriceTick('150');
    await engine.start();

    await engine.onPriceTick('95');

    expect(engine.isRunning()).toBe(false);
    expect(exchange.canceled).toHaveLength(0);
  });

  it('stop-loss triggers a stop with cancel-all', async () => {
    const { engine, exchange } = makeEngine({ config: { stopLossPrice: '90' } });
    await engine.initialize();
    await engine.onPriceTick('150');
    await engine.start();

    const lifecycle: Array<{ action: string; reason: string }> = [];
    engine.on('lifecycle', a => lifecycle.push(a));

    await engine.onPriceTick('89');

    expect(lifecycle).toHaveLength(1);
    expect(lifecycle[0].action).toBe('STOP');
    expect(lifecycle[0].reason).toBe('stop-loss');
    expect(engine.isRunning()).toBe(false);
    expect(exchange.canceled).toHaveLength(2);
  });

  it('take-profit triggers a stop with cancel-all', async () => {
    const { engine, exchange } = makeEngine({ config: { takeProfitPrice: '210' } });
    await engine.initialize();
    await engine.onPriceTick('150');
    await engine.start();

    const lifecycle: Array<{ action: string; reason: string }> = [];
    engine.on('lifecycle', a => lifecycle.push(a));

    await engine.onPriceTick('211');

    expect(lifecycle[0].reason).toBe('take-profit');
    expect(engine.isRunning()).toBe(false);
  });

  it('cancelAllGridOrders cancels known orders and reports them', async () => {
    const { engine, exchange } = makeEngine({});
    await engine.initialize();
    await engine.onPriceTick('150');
    await engine.start();

    const known = engine.knownOrderIds();
    expect(known).toHaveLength(2);

    const { canceled } = await engine.cancelAllGridOrders('test');
    expect(canceled.sort()).toEqual(known.sort());
    expect(engine.knownOrderIds()).toHaveLength(0);
  });
});
