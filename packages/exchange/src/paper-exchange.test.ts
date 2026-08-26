import { describe, it, expect, beforeEach } from 'vitest';
import Decimal from 'decimal.js';
import { PaperExchange } from './paper-exchange';
import { WallexOrderRequest } from './rest-client';

const SYMBOL = 'BTCUSDT';

function makeExchange(): PaperExchange {
  return new PaperExchange({
    initialBalances: { USDT: '10000', BTC: '5' },
    makerFeeRate: '0.0035',
    takerFeeRate: '0.0035',
    minNotional: '1',
  });
}

const limitOrder = (over: Partial<WallexOrderRequest> = {}): WallexOrderRequest => ({
  symbol: SYMBOL,
  side: 'BUY',
  type: 'LIMIT',
  price: '100',
  quantity: '2',
  client_id: 'ord-1',
  ...over,
} as WallexOrderRequest);

describe('PaperExchange order creation', () => {
  let px: PaperExchange;
  beforeEach(() => {
    px = makeExchange();
  });

  it('locks quote balance on BUY create', async () => {
    await px.createOrder(limitOrder());
    const usdt = px.getBalance('USDT')!;
    expect(usdt.locked.toString()).toBe('200');
    expect(usdt.available.toString()).toBe('9800');
    expect(usdt.total.toString()).toBe('10000');
  });

  it('locks base balance on SELL create', async () => {
    await px.createOrder(limitOrder({ side: 'SELL', client_id: 'sell-1', price: '110', quantity: '1' }));
    const btc = px.getBalance('BTC')!;
    expect(btc.locked.toString()).toBe('1');
    expect(btc.available.toString()).toBe('4');
  });

  it('rejects buys exceeding available quote', async () => {
    await expect(
      px.createOrder(limitOrder({ quantity: '200', client_id: 'big' })),
    ).rejects.toThrow('Insufficient USDT balance');
  });

  it('rejects sells exceeding available base', async () => {
    await expect(
      px.createOrder(limitOrder({ side: 'SELL', quantity: '10', client_id: 'big-sell' })),
    ).rejects.toThrow('Insufficient BTC balance');
  });

  it('rejects orders below min notional', async () => {
    await expect(
      px.createOrder(limitOrder({ price: '100', quantity: '0.005', client_id: 'dust' })),
    ).rejects.toThrow('below minimum');
  });

  it('is idempotent on duplicate clientOrderId (no double lock)', async () => {
    await px.createOrder(limitOrder());
    await px.createOrder(limitOrder());
    const usdt = px.getBalance('USDT')!;
    expect(usdt.locked.toString()).toBe('200');
  });
});

describe('PaperExchange maker fills', () => {
  let px: PaperExchange;
  beforeEach(() => {
    px = makeExchange();
    px.updatePrice(SYMBOL, '110');
  });

  it('fills a resting BUY when price ticks to the limit (at limit price, maker fee in base)', async () => {
    const updates: unknown[] = [];
    px.on('trade.detail', t => updates.push(t));

    await px.createOrder(limitOrder({ price: '100', quantity: '2' }));
    expect((await px.getOrder('ord-1')).status).toBe('NEW');

    px.updatePrice(SYMBOL, '100');

    const order = await px.getOrder('ord-1');
    expect(order.status).toBe('FILLED');
    expect(order.executedQty).toBe('2');

    const fills = px.getFills('ord-1');
    expect(fills).toHaveLength(1);
    expect(fills[0].price.toString()).toBe('100');
    expect(fills[0].isMaker).toBe(true);
    expect(fills[0].feeAsset).toBe('BTC');
    // fee = 200 * 0.0035 / 100 = 0.007 BTC
    expect(fills[0].fee.toFixed(6)).toBe('0.007000');

    // BTC received net of base fee: 2 - 0.007
    const btc = px.getBalance('BTC')!;
    expect(btc.total.toFixed(6)).toBe(new Decimal('5').plus('1.993').toFixed(6));
    const usdt = px.getBalance('USDT')!;
    expect(usdt.locked.toString()).toBe('0');
    expect(usdt.available.toFixed(2)).toBe('9800.00');

    expect(updates).toHaveLength(1);
  });

  it('returns surplus quote when a buy crosses favorably', async () => {
    await px.createOrder(limitOrder({ price: '100', quantity: '2' }));
    // Market gaps down through the limit; fill still at the resting limit (maker model)
    px.updatePrice(SYMBOL, '95');
    const usdt = px.getBalance('USDT')!;
    expect(usdt.locked.toString()).toBe('0');
    expect(usdt.available.toFixed(2)).toBe('9800.00');
  });

  it('fills a resting SELL when price ticks to the limit (fee in quote)', async () => {
    await px.createOrder(limitOrder({ side: 'SELL', client_id: 'sell-1', price: '110', quantity: '1' }));
    px.updatePrice(SYMBOL, '110');

    const order = await px.getOrder('sell-1');
    expect(order.status).toBe('FILLED');

    const fills = px.getFills('sell-1');
    expect(fills[0].feeAsset).toBe('USDT');
    // fee = 110 * 0.0035 = 0.385 USDT
    expect(fills[0].fee.toFixed(4)).toBe('0.3850');

    const usdt = px.getBalance('USDT')!;
    // credited 110 - 0.385 on top of the untouched 10000
    expect(usdt.total.toFixed(4)).toBe('10109.6150');
    const btc = px.getBalance('BTC')!;
    expect(btc.total.toString()).toBe('4');
  });

  it('does not re-fill on a repeated identical tick', async () => {
    await px.createOrder(limitOrder({ price: '105', quantity: '1' }));
    px.updatePrice(SYMBOL, '105');
    px.updatePrice(SYMBOL, '105');
    expect(px.getFills('ord-1')).toHaveLength(1);
  });

  it('fills MARKET orders immediately at the current price (taker)', async () => {
    await px.createOrder(limitOrder({ type: 'MARKET', client_id: 'mkt-1', price: '110', quantity: '1' }));
    const order = await px.getOrder('mkt-1');
    expect(order.status).toBe('FILLED');
    const fills = px.getFills('mkt-1');
    expect(fills[0].price.toString()).toBe('110');
    expect(fills[0].isMaker).toBe(false);
  });
});

describe('PaperExchange cancel and stop orders', () => {
  let px: PaperExchange;
  beforeEach(() => {
    px = makeExchange();
    px.updatePrice(SYMBOL, '110');
  });

  it('restores balances on cancel', async () => {
    await px.createOrder(limitOrder({ price: '100', quantity: '2' }));
    await px.cancelOrder('ord-1');

    const usdt = px.getBalance('USDT')!;
    expect(usdt.locked.toString()).toBe('0');
    expect(usdt.available.toString()).toBe('10000');
    expect((await px.getOrder('ord-1')).status).toBe('CANCELED');
    expect(Object.keys(await px.getOpenOrders())).toHaveLength(0);
  });

  it('rejects cancel of unknown or filled orders', async () => {
    await expect(px.cancelOrder('nope')).rejects.toThrow('not found');
    await px.createOrder(limitOrder({ type: 'MARKET', client_id: 'mkt', price: '110', quantity: '1' }));
    await expect(px.cancelOrder('mkt')).rejects.toThrow('cannot be canceled');
  });

  it('STOP_MARKET sells trigger when price crosses down through the stop', async () => {
    await px.createOrder(
      limitOrder({
        side: 'SELL',
        type: 'STOP_MARKET',
        client_id: 'sl-1',
        price: '95',
        quantity: '1',
        stop_Price: '95',
      } as Partial<WallexOrderRequest>),
    );

    // Above the stop: untouched
    px.updatePrice(SYMBOL, '100');
    expect((await px.getOrder('sl-1')).status).toBe('NEW');

    // Cross the stop: triggers and fills at market
    px.updatePrice(SYMBOL, '94');
    const order = await px.getOrder('sl-1');
    expect(order.status).toBe('FILLED');
    const fills = px.getFills('sl-1');
    expect(fills[0].price.toString()).toBe('94');
    expect(fills[0].isMaker).toBe(false);
  });

  it('snapshot/load balances round-trips state', async () => {
    await px.createOrder(limitOrder({ price: '100', quantity: '2' }));
    const snap = px.snapshotBalances();

    const fresh = new PaperExchange({});
    fresh.loadBalances(snap);
    const loaded = fresh.snapshotBalances();
    expect(loaded).toEqual(snap);
  });
});
