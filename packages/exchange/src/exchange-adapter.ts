/**
 * Unified Wallex Exchange Adapter
 *
 * Implements the shared ExchangePort interface with two backends:
 * - LIVE: Wallex REST (+ optional WebSocket market data)
 * - DRY_RUN: PaperExchange simulator (public REST still used for market data)
 */

import EventEmitter from 'events';
import {
  Balance,
  ExchangePort,
  MarketInfo,
  OrderSide,
  OrderStatus,
  OrderType,
  PlaceOrderRequest,
  PlacedOrder,
  PortDepth,
  PortFees,
  TradingMode,
  logger,
  parseWallexMarket,
} from '@wallex/shared';
import {
  WallexRestClient,
  WallexOrderRequest,
  WallexOrderResponse,
  WallexOpenOrder,
  WallexMarket,
} from './rest-client';
import { WallexWebSocketClient } from './ws-client';
import { MarketDataService } from './market-data-service';
import { PaperExchange } from './paper-exchange';

export enum ExchangeMode {
  LIVE = 'LIVE',
  DRY_RUN = 'DRY_RUN',
}

export interface WallexExchangeConfig {
  mode: ExchangeMode;
  /** Default symbol for this adapter (bots may override per call). */
  symbol?: string;
  /** Required for LIVE. */
  apiKey?: string;
  apiKeyHeader?: string;
  subAccountClientId?: string;
  baseUrl?: string;
  rateLimitPer10s?: number;
  initialBalances?: Record<string, string>;
  makerFeeRate?: string;
  takerFeeRate?: string;
  minNotional?: string;
  /** Enable WebSocket-backed MarketDataService (default true). */
  wsEnabled?: boolean;
  stalePriceTimeoutMs?: number;
  pollIntervalMs?: number;
}

export interface Ticker {
  symbol: string;
  lastPrice: string;
  bidPrice?: string;
  askPrice?: string;
}

export interface OrderResult extends PlacedOrder {}

export interface CancelResult {
  clientOrderId: string;
  status: 'CANCELED' | 'NOT_FOUND' | 'REJECTED';
}

const DEFAULT_FEES: PortFees = { makerFeeRate: '0.0035', takerFeeRate: '0.0035' };

function mapStatus(status: string): OrderStatus {
  switch ((status || '').toUpperCase()) {
    case 'PENDING':
      return OrderStatus.PENDING;
    case 'NEW':
    case 'OPEN':
      return OrderStatus.NEW;
    case 'PARTIALLY_FILLED':
      return OrderStatus.PARTIALLY_FILLED;
    case 'FILLED':
    case 'DONE':
    case 'CLOSED':
      return OrderStatus.FILLED;
    case 'CANCELED':
    case 'CANCELLED':
      return OrderStatus.CANCELED;
    case 'REJECTED':
      return OrderStatus.REJECTED;
    case 'EXPIRED':
      return OrderStatus.EXPIRED;
    default:
      return OrderStatus.UNKNOWN;
  }
}

function mapSide(side: string): OrderSide {
  return side === 'SELL' ? OrderSide.SELL : OrderSide.BUY;
}

export class WallexExchange extends EventEmitter implements ExchangePort {
  readonly mode: TradingMode;
  private readonly exchangeMode: ExchangeMode;
  private readonly defaultSymbol: string;
  private readonly _restClient: WallexRestClient;
  private readonly _paperExchange?: PaperExchange;
  private _wsClient?: WallexWebSocketClient;
  private _marketDataService?: MarketDataService;
  private readonly wsEnabled: boolean;
  private readonly feesDefault: PortFees;
  private liveFeesCache?: Record<string, PortFees>;

  constructor(config: WallexExchangeConfig) {
    super();
    this.exchangeMode = config.mode;
    this.mode = config.mode === ExchangeMode.LIVE ? TradingMode.LIVE : TradingMode.DRY_RUN;
    this.defaultSymbol = config.symbol ?? '';
    this.wsEnabled = config.wsEnabled ?? true;
    this.feesDefault = {
      makerFeeRate: config.makerFeeRate || DEFAULT_FEES.makerFeeRate,
      takerFeeRate: config.takerFeeRate || DEFAULT_FEES.takerFeeRate,
    };

    if (config.mode === ExchangeMode.LIVE && !config.apiKey) {
      throw new Error('WallexExchange LIVE mode requires apiKey');
    }

    this._restClient = new WallexRestClient({
      baseUrl: config.baseUrl || process.env.WALLEX_API_BASE_URL || 'https://api.wallex.ir',
      apiKey: config.apiKey,
      apiKeyHeader: config.apiKeyHeader || process.env.WALLEX_API_KEY_HEADER,
      subAccountClientId: config.subAccountClientId || process.env.SUB_ACCOUNT_CLIENT_ID,
      rateLimitPer10s: config.rateLimitPer10s,
    });

    if (config.mode === ExchangeMode.DRY_RUN) {
      this._paperExchange = new PaperExchange({
        initialBalances: config.initialBalances,
        makerFeeRate: config.makerFeeRate,
        takerFeeRate: config.takerFeeRate,
        minNotional: config.minNotional || process.env.MIN_NOTIONAL_FALLBACK,
      });
      this.wirePaperEvents();
      logger.info('Initialized WallexExchange in DRY_RUN mode');
    } else {
      logger.info('Initialized WallexExchange in LIVE mode');
    }
  }

  // ==========================================================================
  // Accessors for worker wiring
  // ==========================================================================

  get restClient(): WallexRestClient {
    return this._restClient;
  }

  get paperExchange(): PaperExchange | undefined {
    return this._paperExchange;
  }

  get wsClient(): WallexWebSocketClient | undefined {
    return this._wsClient;
  }

  get marketDataService(): MarketDataService {
    if (!this._marketDataService) {
      if (this.wsEnabled && !this._wsClient) {
        this._wsClient = new WallexWebSocketClient({
          url: process.env.WALLEX_WS_URL || 'wss://api.wallex.ir/ws',
          streamKey: process.env.WALLEX_STREAM_KEY,
        });
        this._wsClient.connect();
      }
      this._marketDataService = new MarketDataService({
        restClient: this._restClient,
        wsClient: this._wsClient,
      });
    }
    return this._marketDataService;
  }

  /** Feed a price tick into the paper exchange (dry-run fill driver). */
  updatePrice(symbol: string, price: string): void {
    this._paperExchange?.updatePrice(symbol, price);
  }

  // ==========================================================================
  // ExchangePort implementation
  // ==========================================================================

  async getMarket(symbol: string): Promise<MarketInfo> {
    const market = await this._restClient.getMarket(symbol);
    if (!market) {
      throw new Error(`Market not found: ${symbol}`);
    }
    return this.normalizeMarket(market);
  }

  private normalizeMarket(m: WallexMarket): MarketInfo {
    return parseWallexMarket({
      symbol: m.symbol,
      base_asset: m.base_asset,
      quote_asset: m.quote_asset,
      is_spot: m.is_spot,
      price_precision: m.price_precision,
      amount_precision: m.amount_precision,
      min_notional: undefined,
      last_price: m.price,
      volume_24h: m.volume_24h,
    });
  }

  async getBalances(): Promise<Record<string, Balance>> {
    const out: Record<string, Balance> = {};

    if (this.exchangeMode === ExchangeMode.LIVE) {
      const res = await this._restClient.getBalances();
      const balances = res?.balances || {};
      for (const [asset, b] of Object.entries(balances)) {
        const total = Number(b.value || '0');
        const locked = Number(b.locked || '0');
        out[asset] = {
          asset,
          total: String(total),
          available: String(Math.max(total - locked, 0)),
          locked: String(locked),
        };
      }
      return out;
    }

    const paper = this._paperExchange!.getBalances();
    for (const [asset, b] of Object.entries(paper)) {
      const total = Number(b.value || '0');
      const locked = Number(b.locked || '0');
      out[asset] = {
        asset,
        total: String(total),
        available: String(Math.max(total - locked, 0)),
        locked: String(locked),
      };
    }
    return out;
  }

  async getFees(symbol: string): Promise<PortFees> {
    if (this.exchangeMode === ExchangeMode.DRY_RUN) {
      return { ...this.feesDefault };
    }

    if (!this.liveFeesCache) {
      try {
        const fees = await this._restClient.getFees();
        this.liveFeesCache = {};
        for (const [sym, info] of Object.entries(fees || {})) {
          this.liveFeesCache[sym] = {
            makerFeeRate: String(info.makerFeeRate ?? this.feesDefault.makerFeeRate),
            takerFeeRate: String(info.takerFeeRate ?? this.feesDefault.takerFeeRate),
          };
        }
      } catch (err) {
        logger.warn({ err }, 'Failed to fetch live fees, using defaults');
        return { ...this.feesDefault };
      }
    }

    return this.liveFeesCache[symbol] || this.liveFeesCache[symbol.toLowerCase()] || { ...this.feesDefault };
  }

  async getDepth(symbol: string): Promise<PortDepth> {
    const depth = await this._restClient.getDepth(symbol);
    return {
      bestBid: depth.bid?.length > 0 ? depth.bid[0].price : undefined,
      bestAsk: depth.ask?.length > 0 ? depth.ask[0].price : undefined,
    };
  }

  async placeOrder(req: PlaceOrderRequest): Promise<PlacedOrder> {
    const wallexReq: WallexOrderRequest = {
      symbol: req.symbol,
      side: req.side as 'BUY' | 'SELL',
      type: req.type as 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET',
      price: req.price,
      quantity: req.quantity,
      client_id: req.clientOrderId,
    };
    if (req.stopPrice) {
      wallexReq.stop_Price = req.stopPrice;
    }

    if (this.exchangeMode === ExchangeMode.LIVE) {
      const response = await this._restClient.createOrder(wallexReq);
      return this.mapOrderResponse(response, req);
    }

    const response = await this._paperExchange!.createOrder(wallexReq);
    return this.mapOrderResponse(response, req);
  }

  async cancelOrder(clientOrderId: string): Promise<{
    clientOrderId: string;
    status: 'CANCELED' | 'NOT_FOUND';
  }> {
    try {
      if (this.exchangeMode === ExchangeMode.LIVE) {
        await this._restClient.cancelOrder(clientOrderId);
      } else {
        await this._paperExchange!.cancelOrder(clientOrderId);
      }
      return { clientOrderId, status: 'CANCELED' };
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (
        msg.includes('not found') ||
        msg.includes('cannot be canceled') ||
        err?.statusCode === 404
      ) {
        return { clientOrderId, status: 'NOT_FOUND' };
      }
      throw err;
    }
  }

  /** Look up a single order by clientOrderId (live: REST; dry-run: paper). */
  async getOrder(clientOrderId: string): Promise<PlacedOrder | undefined> {
    try {
      if (this.exchangeMode === ExchangeMode.LIVE) {
        const response = await this._restClient.getOrder(clientOrderId);
        return this.mapOrderResponse(response);
      }
      const response = await this._paperExchange!.getOrder(clientOrderId);
      return this.mapOrderResponse(response);
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg.includes('not found') || err?.statusCode === 404) return undefined;
      throw err;
    }
  }

  /** Best-effort normalization of raw WS/paper order payloads into PlacedOrder. */
  normalizeOrderEvent(payload: unknown): PlacedOrder | undefined {
    const p = payload as Record<string, unknown> | null;
    if (!p || typeof p !== 'object') return undefined;
    if (typeof p.clientOrderId !== 'string') return undefined;
    return this.mapOrderResponse(p as unknown as WallexOrderResponse);
  }

  async getOpenOrders(symbol: string): Promise<PlacedOrder[]> {
    if (this.exchangeMode === ExchangeMode.LIVE) {
      const open: WallexOpenOrder[] = await this._restClient.getOpenOrdersForSymbol(symbol);
      return open.map(o => this.mapOrderResponse(o as WallexOrderResponse, undefined));
    }

    const records = await this._paperExchange!.getOpenOrders(symbol);
    const list = records[symbol] || [];
    return list.map(o => this.mapOrderResponse(o, undefined));
  }

  async getFillsSince(symbol: string, sinceTs: number): Promise<PlacedOrder[]> {
    if (this.exchangeMode === ExchangeMode.LIVE) {
      const result = await this._restClient.getOrders({
        market: symbol,
        from: sinceTs,
        to: Date.now(),
        per_page: 100,
      });
      const orders = result[symbol] || Object.values(result || {}).flat();
      return orders
        .filter(o => (o.transactTime ?? 0) >= sinceTs || (o.fills?.length ?? 0) > 0)
        .map(o => this.mapOrderResponse(o, undefined));
    }

    const fills = this._paperExchange!.getFillsSince(sinceTs).filter(f => f.symbol === symbol);
    return fills.map(f => ({
      clientOrderId: f.clientOrderId,
      symbol: f.symbol,
      side: f.side === 'SELL' ? OrderSide.SELL : OrderSide.BUY,
      type: OrderType.LIMIT,
      status: OrderStatus.FILLED,
      price: f.price.toString(),
      quantity: f.quantity.toString(),
      executedQty: f.quantity.toString(),
      executedSum: f.price.times(f.quantity).toString(),
      fee: f.fee.toString(),
      fills: [
        {
          price: f.price.toString(),
          quantity: f.quantity.toString(),
          fee: f.fee.toString(),
          feeAsset: f.feeAsset,
        },
      ],
    }));
  }

  // ==========================================================================
  // Events (order.update / trade.detail)
  // ==========================================================================

  private wirePaperEvents(): void {
    const paper = this._paperExchange!;
    paper.on('order.update', (payload: unknown) =>
      this.emit('order.update', this.mapOrderResponse(payload as WallexOrderResponse)),
    );
    paper.on('trade.detail', (payload: unknown) => this.emit('trade.detail', payload));
  }

  /** Subscribe to private WS channels (live mode with stream key). */
  connectPrivateChannels(): void {
    if (this.exchangeMode !== ExchangeMode.LIVE) return;
    const ws = this.marketDataServiceWs();
    if (!ws) return;
    ws.on('order.update', (payload: unknown) => this.emit('order.update', payload));
    ws.on('trade.detail', (payload: unknown) => this.emit('trade.detail', payload));
    ws.subscribeBalanceUpdates();
    ws.subscribeTradeDetails();
  }

  private marketDataServiceWs(): WallexWebSocketClient | undefined {
    // Touching the service creates the WS client when wsEnabled
    this.marketDataService;
    return this._wsClient;
  }

  // ==========================================================================
  // Mapping helpers
  // ==========================================================================

  private mapOrderResponse(
    response: WallexOrderResponse,
    req?: PlaceOrderRequest,
  ): PlacedOrder {
    const executedSum = (response.fills || []).reduce((acc, f) => {
      const sum = Number(f.price) * Number(f.quantity);
      return acc + (Number.isFinite(sum) ? sum : 0);
    }, 0);
    const fee = (response.fills || []).reduce((acc, f) => {
      const v = Number(f.fee);
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);

    return {
      clientOrderId: response.clientOrderId,
      symbol: response.symbol,
      side: mapSide(response.side),
      type: (req?.type ?? OrderType.LIMIT) as OrderType,
      status: mapStatus(response.status),
      price: String(response.price),
      quantity: String(response.origQty),
      executedQty: String(response.executedQty || '0'),
      executedSum: executedSum.toFixed(16),
      fee: fee.toFixed(16),
      fills: (response.fills || []).map(f => ({
        price: String(f.price),
        quantity: String(f.quantity),
        fee: String(f.fee),
        feeAsset: f.feeAsset,
      })),
    };
  }

  // ==========================================================================
  // Convenience
  // ==========================================================================

  async getTicker(symbol: string): Promise<Ticker | null> {
    const data = this.marketDataService.getMarketData(symbol);
    if (data?.price) {
      return {
        symbol,
        lastPrice: data.price,
        bidPrice: data.bid,
        askPrice: data.ask,
      };
    }

    try {
      const market = await this._restClient.getMarket(symbol);
      if (!market) return null;
      const depth = await this.getDepth(symbol).catch(() => ({ bestBid: undefined, bestAsk: undefined }));
      return {
        symbol,
        lastPrice: String(market.price ?? ''),
        bidPrice: depth.bestBid,
        askPrice: depth.bestAsk,
      };
    } catch {
      return null;
    }
  }

  /**
   * Cancel all open orders for a symbol. In live mode only orders whose
   * clientOrderId passes the filter are canceled (never cancels unknown orders).
   */
  async cancelAllOrders(
    symbol: string,
    options?: { clientOrderIdFilter?: (clientOrderId: string) => boolean },
  ): Promise<{ canceled: string[]; failed: string[]; skipped: string[] }> {
    if (this.exchangeMode === ExchangeMode.LIVE) {
      const res = await this._restClient.cancelAllOrders(symbol, options);
      return { ...res, skipped: [] };
    }

    const records = await this._paperExchange!.getOpenOrders(symbol);
    const open = records[symbol] || [];
    const canceled: string[] = [];
    const failed: string[] = [];
    const skipped: string[] = [];
    for (const order of open) {
      if (options?.clientOrderIdFilter && !options.clientOrderIdFilter(order.clientOrderId)) {
        skipped.push(order.clientOrderId);
        continue;
      }
      try {
        await this._paperExchange!.cancelOrder(order.clientOrderId);
        canceled.push(order.clientOrderId);
      } catch {
        failed.push(order.clientOrderId);
      }
    }
    return { canceled, failed, skipped };
  }

  /** Clean shutdown of WS + polling. */
  close(): void {
    this._marketDataService?.clear();
    if (this._wsClient) {
      this._wsClient.disconnect();
      this._wsClient = undefined;
    }
    this._marketDataService = undefined;
  }
}

export default WallexExchange;
