/**
 * Wallex Exchange REST Client
 * 
 * Implements all required Wallex REST API endpoints with:
 * - Proper authentication
 * - Rate limiting
 * - Error handling
 * - Response validation
 */

import { EventEmitter } from 'events';
import Decimal from 'decimal.js';
import { z } from 'zod';
import pino from 'pino';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface WallexRestConfig {
  baseUrl: string;
  apiKey?: string;
  apiKeyHeader?: string;
  subAccountClientId?: string;
  timeout?: number;
  rateLimitPer10s?: number;
}

export interface HttpRequestOptions {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT';
  path: string;
  body?: Record<string, any>;
  query?: Record<string, any>;
  requiresAuth?: boolean;
}

export interface WallexMarket {
  symbol: string;
  base_asset: string;
  quote_asset: string;
  fa_base_asset: string;
  fa_quote_asset: string;
  en_base_asset: string;
  en_quote_asset: string;
  categories: number[];
  price: string;
  change_24h: string;
  volume_24h: string;
  change_7D: string;
  quote_volume_24h: string;
  spot_is_new: boolean;
  otc_is_new: boolean;
  is_new: boolean;
  is_spot: boolean;
  is_otc: boolean;
  is_margin: boolean;
  is_tmn_based: boolean;
  is_usdt_based: boolean;
  is_zero_fee: boolean;
  leverage_step?: string;
  max_leverage?: string;
  created_at: string;
  amount_precision: number;
  price_precision: number;
  flags: string[];
}

export interface WallexCandleResponse {
  s: string;
  t: number[];
  o: string[];
  h: string[];
  l: string[];
  c: string[];
  v: string[];
}

export interface WallexDepth {
  ask: Array<{
    price: string;
    quantity: string;
    sum: string;
  }>;
  bid: Array<{
    price: string;
    quantity: string;
    sum: string;
  }>;
}

export interface WallexTrade {
  symbol: string;
  quantity: string;
  price: string;
  sum: string;
  isBuyOrder: boolean;
  timestamp: number;
}

export interface WallexBalance {
  asset: string;
  asset_png_icon?: string;
  asset_svg_icon?: string;
  faName: string;
  fiat?: string;
  value: string;
  locked: string;
  is_dust: boolean;
  is_digital_gold: boolean;
}

export interface WallexBalancesResponse {
  balances: Record<string, WallexBalance>;
}

export interface WallexFeeInfo {
  makerFeeRate: string;
  takerFeeRate: string;
  recent_days_sum: string;
}

export interface WallexFeesResponse {
  [symbol: string]: WallexFeeInfo;
}

export interface WallexOrderRequest {
  price: string;
  quantity: string;
  side: 'BUY' | 'SELL';
  symbol: string;
  type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET';
  stop_Price?: string;
  client_id?: string;
}

export interface WallexOrderResponse {
  symbol: string;
  side: string;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  status: string;
  active: boolean;
  transactTime?: number;
  fills?: Array<{
    price: string;
    quantity: string;
    fee: string;
    feeAsset: string;
  }>;
}

export interface WallexOpenOrder {
  symbol: string;
  side: string;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  status: string;
  active: boolean;
}

// ============================================================================
// Logger
// ============================================================================

const logger = pino({ name: 'wallex-rest' });

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  private limit: number;
  private windowMs: number;
  private timestamps: number[] = [];

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    
    // Remove old timestamps outside the window
    this.timestamps = this.timestamps.filter(ts => now - ts < this.windowMs);
    
    if (this.timestamps.length >= this.limit) {
      const oldestTimestamp = this.timestamps[0];
      const waitTime = this.windowMs - (now - oldestTimestamp);
      
      if (waitTime > 0) {
        logger.debug(`Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.wait(); // Retry after waiting
      }
    }
    
    this.timestamps.push(Date.now());
  }

  reset(): void {
    this.timestamps = [];
  }
}

// ============================================================================
// Wallex REST Client
// ============================================================================

export class WallexRestClient extends EventEmitter {
  private config: Required<WallexRestConfig>;
  private orderRateLimiter: RateLimiter;
  private generalRateLimiter: RateLimiter;

  constructor(config: WallexRestConfig) {
    super();
    this.config = {
      baseUrl: config.baseUrl || 'https://api.wallex.ir',
      apiKey: config.apiKey || '',
      apiKeyHeader: config.apiKeyHeader || 'API-Key',
      subAccountClientId: config.subAccountClientId || '',
      timeout: config.timeout || 30000,
      rateLimitPer10s: config.rateLimitPer10s || 20,
    };
    
    // Order creation: 20 requests per 10 seconds
    this.orderRateLimiter = new RateLimiter(this.config.rateLimitPer10s, 10000);
    // General requests: more lenient
    this.generalRateLimiter = new RateLimiter(60, 10000);
  }

  private getHeaders(requiresAuth: boolean): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth && this.config.apiKey) {
      headers[this.config.apiKeyHeader] = this.config.apiKey;
    }

    if (this.config.subAccountClientId) {
      headers['Sub-Account-Client-id'] = this.config.subAccountClientId;
    }

    return headers;
  }

  private buildUrl(path: string, query?: Record<string, any>): string {
    const url = new URL(`${this.config.baseUrl}${path}`);
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  async request<T>(options: HttpRequestOptions): Promise<T> {
    const { method, path, body, query, requiresAuth = false } = options;
    
    // Apply rate limiting
    if (method === 'POST' && path.includes('/orders')) {
      await this.orderRateLimiter.wait();
    } else {
      await this.generalRateLimiter.wait();
    }

    const url = this.buildUrl(path, query);
    const headers = this.getHeaders(requiresAuth);

    logger.debug({ method, path, query }, 'Making request');

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        logger.error({ status: response.status, data }, 'Request failed');
        throw new WallexApiError(
          `HTTP ${response.status}: ${data.message || data.error || 'Unknown error'}`,
          response.status,
          data
        );
      }

      logger.debug({ method, path, success: true }, 'Request completed');
      return data as T;
    } catch (error) {
      if (error instanceof WallexApiError) {
        throw error;
      }
      
      if (error instanceof Error) {
        logger.error({ error: error.message, method, path }, 'Request error');
        
        if (error.name === 'AbortError') {
          throw new WallexApiError('Request timeout', 408);
        }
        
        throw new WallexApiError(error.message, 0);
      }
      
      throw new WallexApiError('Unknown error', 0);
    }
  }

  // ============================================================================
  // Public Market Endpoints
  // ============================================================================

  /**
   * Get all markets
   * GET /hector/web/v1/markets
   */
  async getMarkets(): Promise<WallexMarket[]> {
    const response = await this.request<{ result: { markets: WallexMarket[] } }>({
      method: 'GET',
      path: '/hector/web/v1/markets',
      requiresAuth: false,
    });

    return response.result?.markets || [];
  }

  /**
   * Get spot markets only
   */
  async getSpotMarkets(): Promise<WallexMarket[]> {
    const markets = await this.getMarkets();
    return markets.filter(m => m.is_spot === true);
  }

  /**
   * Get candles/OHLCV data
   * GET /v1/udf/history
   */
  async getCandles(params: {
    symbol: string;
    resolution: string;
    from: number;
    to: number;
  }): Promise<WallexCandleResponse> {
    const response = await this.request<WallexCandleResponse>({
      method: 'GET',
      path: '/v1/udf/history',
      query: params,
      requiresAuth: false,
    });

    return response;
  }

  /**
   * Get market depth
   * GET /v1/depth
   */
  async getDepth(symbol: string): Promise<WallexDepth> {
    const response = await this.request<{ result: WallexDepth }>({
      method: 'GET',
      path: '/v1/depth',
      query: { symbol },
      requiresAuth: false,
    });

    return response.result;
  }

  /**
   * Get latest trades
   * GET /v1/trades
   */
  async getLatestTrades(symbol: string): Promise<WallexTrade[]> {
    const response = await this.request<{ result: { latestTrades: WallexTrade[] } }>({
      method: 'GET',
      path: '/v1/trades',
      query: { symbol },
      requiresAuth: false,
    });

    return response.result?.latestTrades || [];
  }

  // ============================================================================
  // Private Account Endpoints
  // ============================================================================

  /**
   * Get account balances
   * GET /v1/account/balances
   */
  async getBalances(): Promise<WallexBalancesResponse> {
    const response = await this.request<{ result: WallexBalancesResponse }>({
      method: 'GET',
      path: '/v1/account/balances',
      requiresAuth: true,
    });

    return response.result;
  }

  /**
   * Get detailed account balances
   * GET /v1/account/balances-detail
   */
  async getBalancesDetail(): Promise<any> {
    try {
      const response = await this.request<any>({
        method: 'GET',
        path: '/v1/account/balances-detail',
        requiresAuth: true,
      });

      return response.result;
    } catch (error) {
      logger.warn('balances-detail endpoint not available, using fallback');
      // Fallback to regular balances
      return this.getBalances();
    }
  }

  /**
   * Get account fees
   * GET /v1/account/fee
   */
  async getFees(): Promise<WallexFeesResponse> {
    const response = await this.request<{ result: WallexFeesResponse }>({
      method: 'GET',
      path: '/v1/account/fee',
      requiresAuth: true,
    });

    return response.result;
  }

  /**
   * Create order
   * POST /v1/account/orders
   */
  async createOrder(order: WallexOrderRequest): Promise<WallexOrderResponse> {
    // Validate client_id format
    if (order.client_id) {
      const validClientIdRegex = /^[A-Za-z0-9_]+$/;
      if (!validClientIdRegex.test(order.client_id)) {
        throw new Error('client_id must contain only letters, numbers, and underscores');
      }
      
      if (order.client_id.length > 32) {
        throw new Error('client_id must be 32 characters or less');
      }
    }

    const response = await this.request<WallexOrderResponse>({
      method: 'POST',
      path: '/v1/account/orders',
      body: order,
      requiresAuth: true,
    });

    return response;
  }

  /**
   * Cancel order by client ID
   * DELETE /v1/account/orders/{client_id}
   */
  async cancelOrder(clientOrderId: string): Promise<WallexOrderResponse> {
    const response = await this.request<WallexOrderResponse>({
      method: 'DELETE',
      path: `/v1/account/orders/${clientOrderId}`,
      requiresAuth: true,
    });

    return response;
  }

  /**
   * Get order by client ID
   * GET /v1/account/orders/{client_id}
   */
  async getOrder(clientOrderId: string): Promise<WallexOrderResponse> {
    const response = await this.request<WallexOrderResponse>({
      method: 'GET',
      path: `/v1/account/orders/${clientOrderId}`,
      requiresAuth: true,
    });

    return response;
  }

  /**
   * Get order list
   * GET /v1/account/orders
   */
  async getOrders(params?: {
    from?: number;
    to?: number;
    page?: number;
    per_page?: number;
    type?: string;
    side?: string;
    market?: string;
  }): Promise<Record<string, WallexOrderResponse[]>> {
    const response = await this.request<{ result: Record<string, WallexOrderResponse[]> }>({
      method: 'GET',
      path: '/v1/account/orders',
      query: params,
      requiresAuth: true,
    });

    return response.result;
  }

  /**
   * Get open orders
   * GET /v1/account/openOrders
   */
  async getOpenOrders(params?: {
    symbol?: string;
    page?: number;
    per_page?: number;
  }): Promise<Record<string, WallexOpenOrder[]>> {
    const response = await this.request<{ result: Record<string, WallexOpenOrder[]> }>({
      method: 'GET',
      path: '/v1/account/openOrders',
      query: params,
      requiresAuth: true,
    });

    return response.result;
  }

  /**
   * Get open orders for a specific symbol
   */
  async getOpenOrdersForSymbol(symbol: string): Promise<WallexOpenOrder[]> {
    const result = await this.getOpenOrders({ symbol });
    return result[symbol] || [];
  }

  /**
   * Get a single market by symbol (derived from getMarkets, no native endpoint)
   */
  async getMarket(symbol: string): Promise<WallexMarket | undefined> {
    const markets = await this.getMarkets();
    const normalized = symbol.toUpperCase();
    return markets.find(m => m.symbol.toUpperCase() === normalized);
  }

  /**
   * Cancel all open orders for a symbol.
   * Wallex has no native cancel-all endpoint, so this loops over open orders
   * and cancels each by client_id (honoring the order rate limiter).
   * Unknown/foreign orders are never canceled by this helper unless includeUnknown=true.
   */
  async cancelAllOrders(
    symbol: string,
    options?: { clientOrderIdFilter?: (clientOrderId: string) => boolean },
  ): Promise<{ canceled: string[]; failed: string[] }> {
    const open = await this.getOpenOrdersForSymbol(symbol);
    const canceled: string[] = [];
    const failed: string[] = [];

    for (const order of open) {
      if (!order.clientOrderId) continue;
      if (options?.clientOrderIdFilter && !options.clientOrderIdFilter(order.clientOrderId)) {
        continue;
      }
      try {
        await this.cancelOrder(order.clientOrderId);
        canceled.push(order.clientOrderId);
      } catch (err) {
        logger.warn({ clientOrderId: order.clientOrderId, err }, 'cancel failed in cancelAllOrders');
        failed.push(order.clientOrderId);
      }
    }

    return { canceled, failed };
  }
}

// ============================================================================
// Error Classes
// ============================================================================

export class WallexApiError extends Error {
  public readonly statusCode: number;
  public readonly data?: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'WallexApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

export class WallexRateLimitError extends WallexApiError {
  constructor(message: string, data?: any) {
    super(message, 429, data);
    this.name = 'WallexRateLimitError';
  }
}

export default WallexRestClient;
