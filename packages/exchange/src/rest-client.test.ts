/**
 * Tests for Wallex REST Client
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WallexRestClient, WallexApiError } from './rest-client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('WallexRestClient', () => {
  let client: WallexRestClient;

  beforeEach(() => {
    client = new WallexRestClient({
      baseUrl: 'https://api.wallex.ir',
      apiKey: 'test-api-key',
    });
  });

  it('should create client with default config', () => {
    expect(client).toBeDefined();
  });

  it('should use custom API key header', () => {
    const customClient = new WallexRestClient({
      baseUrl: 'https://api.wallex.ir',
      apiKey: 'test-key',
      apiKeyHeader: 'X-API-Key',
    });
    expect(customClient).toBeDefined();
  });
});

describe('WallexRestClient response envelopes', () => {
  let client: WallexRestClient;

  beforeEach(() => {
    client = new WallexRestClient({
      baseUrl: 'https://api.wallex.ir',
      apiKey: 'test-api-key',
    });
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('unwraps the result envelope from createOrder (docs: 201 { message, result, success })', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          message: 'ok',
          success: true,
          result: {
            active: true,
            clientOrderId: 'GB_TEST_BUY_L01_ABC',
            origQty: '0.001',
            executedQty: '0',
            price: '50000',
            side: 'BUY',
            status: 'NEW',
            symbol: 'BTCUSDT',
            type: 'LIMIT',
            fills: [],
          },
        },
        201,
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const order = await client.createOrder({
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'LIMIT',
      price: '50000',
      quantity: '0.001',
      client_id: 'GB_TEST_BUY_L01_ABC',
    });

    expect(order.clientOrderId).toBe('GB_TEST_BUY_L01_ABC');
    expect(order.status).toBe('NEW');
    expect(order.side).toBe('BUY');

    const [, init] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse(init.body);
    expect(sentBody.client_id).toBe('GB_TEST_BUY_L01_ABC');
    expect(sentBody.price).toBe('50000');
    expect(init.headers['API-Key']).toBe('test-api-key');
  });

  it('unwraps the result envelope from getOrder', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          message: 'ok',
          success: true,
          result: {
            clientOrderId: 'GB_TEST_SELL_L02_XYZ',
            origQty: '2',
            executedQty: '1',
            price: '110',
            side: 'SELL',
            status: 'PARTIALLY_FILLED',
            symbol: 'BTCUSDT',
            fills: [{ price: '110', quantity: '1', fee: '0.385', feeAsset: 'USDT' }],
          },
        }),
      ),
    );

    const order = await client.getOrder('GB_TEST_SELL_L02_XYZ');
    expect(order.clientOrderId).toBe('GB_TEST_SELL_L02_XYZ');
    expect(order.status).toBe('PARTIALLY_FILLED');
    expect(order.fills?.length).toBe(1);
  });

  it('tolerates already-unwrapped order payloads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          clientOrderId: 'RAW_1',
          origQty: '1',
          executedQty: '0',
          price: '100',
          side: 'BUY',
          status: 'NEW',
          symbol: 'BTCUSDT',
        }),
      ),
    );

    const order = await client.getOrder('RAW_1');
    expect(order.clientOrderId).toBe('RAW_1');
  });

  it('unwraps the result envelope from cancelOrder', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          message: 'canceled',
          success: true,
          result: {
            clientOrderId: 'GB_TEST_BUY_L03_DEL',
            status: 'CANCELED',
            side: 'BUY',
            symbol: 'BTCUSDT',
            price: '100',
            origQty: '1',
            executedQty: '0',
          },
        }),
      ),
    );

    const order = await client.cancelOrder('GB_TEST_BUY_L03_DEL');
    expect(order.clientOrderId).toBe('GB_TEST_BUY_L03_DEL');
    expect(order.status).toBe('CANCELED');
  });

  it('parses open orders grouped by market (defensive parsing)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          message: 'ok',
          success: true,
          result: {
            BTCUSDT: [
              { clientOrderId: 'A1', symbol: 'BTCUSDT', side: 'BUY', price: '100', origQty: '1', executedQty: '0', status: 'NEW', active: true },
            ],
          },
        }),
      ),
    );

    const open = await client.getOpenOrdersForSymbol('BTCUSDT');
    expect(open).toHaveLength(1);
    expect(open[0].clientOrderId).toBe('A1');
  });

  it('throws WallexApiError on HTTP errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ message: 'bad request', error: 'invalid symbol' }, 400)),
    );

    await expect(client.getMarket('NOPE')).rejects.toThrow(WallexApiError);
  });

  it('rejects client_id with invalid characters or length', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ result: {} }, 201));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      client.createOrder({
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'LIMIT',
        price: '1',
        quantity: '1',
        client_id: 'has-dash',
      }),
    ).rejects.toThrow('letters, numbers, and underscores');

    await expect(
      client.createOrder({
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'LIMIT',
        price: '1',
        quantity: '1',
        client_id: 'X'.repeat(33),
      }),
    ).rejects.toThrow('32 characters or less');

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Rate Limiter', () => {
  it('enforces the order creation limit by waiting out the window', async () => {
    vi.useFakeTimers();
    try {
      const client = new WallexRestClient({
        baseUrl: 'https://api.wallex.ir',
        apiKey: 'k',
        rateLimitPer10s: 2,
      });
      const fetchMock = vi.fn().mockImplementation(() => jsonResponse({ result: {} }, 201));
      vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

      const place = () =>
        client.createOrder({
          symbol: 'BTCUSDT',
          side: 'BUY',
          type: 'LIMIT',
          price: '100',
          quantity: '1',
          client_id: `ID_${Math.random().toString(36).slice(2, 8)}`,
        });

      const p1 = place();
      const p2 = place();
      const p3 = place(); // third call must wait for the 10s window

      // First two go through immediately
      await vi.advanceTimersByTimeAsync(0);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      // Third is released after the window expires
      await vi.advanceTimersByTimeAsync(10_000);
      await Promise.all([p1, p2, p3]);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });
});
