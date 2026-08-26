/**
 * Market Data Service
 * 
 * Maintains real-time market data for active symbols:
 * - Subscribes to WebSocket channels
 * - Falls back to REST polling
 * - Detects stale prices
 * - Provides current price, bid, ask
 */

import EventEmitter from 'events';
import pino from 'pino';
import { WallexRestClient, WallexDepth } from './rest-client';
import { WallexWebSocketClient, PriceUpdate, DepthUpdate, TradeUpdate } from './ws-client';

// ============================================================================
// Types
// ============================================================================

export interface MarketData {
  symbol: string;
  price: string;
  bid?: string;
  ask?: string;
  high24h?: string;
  low24h?: string;
  volume24h?: string;
  change24h?: number;
  lastUpdate: number;
  source: 'websocket' | 'rest';
}

export interface MarketDataServiceConfig {
  restClient: WallexRestClient;
  wsClient?: WallexWebSocketClient;
  stalePriceTimeoutMs?: number;
  pollIntervalMs?: number;
}

// ============================================================================
// Error Classes
// ============================================================================

export class StalePriceError extends Error {
  public readonly symbol: string;
  public readonly age: number;

  constructor(symbol: string, age: number) {
    super(`Stale price for ${symbol}: ${age}ms old`);
    this.name = 'StalePriceError';
    this.symbol = symbol;
    this.age = age;
  }
}

// ============================================================================
// Logger
// ============================================================================

const logger = pino({ name: 'market-data-service' });

// ============================================================================
// Market Data Service
// ============================================================================

export class MarketDataService extends EventEmitter {
  private config: Required<MarketDataServiceConfig>;
  private marketData: Map<string, MarketData> = new Map();
  private pollTimers: Map<string, NodeJS.Timeout> = new Map();
  private subscribedSymbols: Set<string> = new Set();

  constructor(config: MarketDataServiceConfig) {
    super();
    this.config = {
      restClient: config.restClient,
      wsClient: config.wsClient || (null as any),
      stalePriceTimeoutMs: config.stalePriceTimeoutMs || 30000,
      pollIntervalMs: config.pollIntervalMs || 5000,
    };

    // Setup WebSocket listeners if available
    if (this.config.wsClient) {
      this.setupWsListeners();
    }
  }

  private setupWsListeners(): void {
    if (!this.config.wsClient) return;

    this.config.wsClient.on('price.update', (update: PriceUpdate) => {
      this.updatePrice(update);
    });

    this.config.wsClient.on('depth.update', (update: DepthUpdate) => {
      this.updateDepth(update);
    });

    this.config.wsClient.on('trade.update', (update: TradeUpdate) => {
      this.updateTrade(update);
    });

    this.config.wsClient.on('ws.disconnected', () => {
      logger.warn('WebSocket disconnected, falling back to REST polling');
      // Ensure all active symbols are being polled
      this.subscribedSymbols.forEach(symbol => {
        if (!this.pollTimers.has(symbol)) {
          this.startPolling(symbol);
        }
      });
    });

    this.config.wsClient.on('ws.connected', () => {
      logger.info('WebSocket connected, switching to real-time updates');
      // Resubscribe the global price channel if any symbols are tracked
      if (this.subscribedSymbols.size > 0) {
        this.config.wsClient.subscribeAllPrices();
      }
      // Stop REST polling for subscribed symbols
      this.subscribedSymbols.forEach(symbol => {
        this.stopPolling(symbol);
      });
    });
  }

  /**
   * Subscribe to market data for a symbol
   */
  subscribe(symbol: string): void {
    if (this.subscribedSymbols.has(symbol)) {
      logger.debug({ symbol }, 'Already subscribed');
      return;
    }

    logger.info({ symbol }, 'Subscribing to market data');
    this.subscribedSymbols.add(symbol);

    // Try WebSocket first
    if (this.config.wsClient && this.config.wsClient.connected) {
      this.config.wsClient.subscribeAllPrices();
      this.config.wsClient.subscribeTrades(symbol);
      this.config.wsClient.subscribeBuyDepth(symbol);
      this.config.wsClient.subscribeSellDepth(symbol);
    } else {
      // Fall back to REST polling
      this.startPolling(symbol);
    }
  }

  /**
   * Unsubscribe from market data for a symbol
   */
  unsubscribe(symbol: string): void {
    if (!this.subscribedSymbols.has(symbol)) {
      return;
    }

    logger.info({ symbol }, 'Unsubscribing from market data');
    this.subscribedSymbols.delete(symbol);

    // Remove WebSocket subscriptions
    if (this.config.wsClient && this.config.wsClient.connected) {
      this.config.wsClient.unsubscribe(`${symbol}@trade`);
      this.config.wsClient.unsubscribe(`${symbol}@buyDepth`);
      this.config.wsClient.unsubscribe(`${symbol}@sellDepth`);
    }

    // Stop REST polling
    this.stopPolling(symbol);

    // Remove cached data
    this.marketData.delete(symbol);
  }

  /**
   * Get current market data for a symbol
   */
  getMarketData(symbol: string): MarketData | undefined {
    return this.marketData.get(symbol);
  }

  /**
   * Get current price for a symbol
   */
  getPrice(symbol: string): string | undefined {
    const data = this.marketData.get(symbol);
    return data?.price;
  }

  /**
   * Get best bid for a symbol
   */
  getBid(symbol: string): string | undefined {
    const data = this.marketData.get(symbol);
    return data?.bid;
  }

  /**
   * Get best ask for a symbol
   */
  getAsk(symbol: string): string | undefined {
    const data = this.marketData.get(symbol);
    return data?.ask;
  }

  /**
   * Get mid price (average of bid and ask)
   */
  getMidPrice(symbol: string): string | undefined {
    const data = this.marketData.get(symbol);
    if (!data?.bid || !data?.ask) {
      return data?.price;
    }

    const bid = parseFloat(data.bid);
    const ask = parseFloat(data.ask);
    return String((bid + ask) / 2);
  }

  /**
   * Check if price is stale
   */
  isPriceStale(symbol: string): boolean {
    const data = this.marketData.get(symbol);
    if (!data) return true;

    const age = Date.now() - data.lastUpdate;
    return age > this.config.stalePriceTimeoutMs;
  }

  /**
   * Validate price is fresh, throw if stale
   */
  validatePriceFresh(symbol: string): void {
    if (this.isPriceStale(symbol)) {
      const data = this.marketData.get(symbol);
      const age = data ? Date.now() - data.lastUpdate : Infinity;
      throw new StalePriceError(symbol, age);
    }
  }

  /**
   * Get all market data
   */
  getAllMarketData(): Map<string, MarketData> {
    return new Map(this.marketData);
  }

  /**
   * Update price from WebSocket or REST
   */
  private updatePrice(update: PriceUpdate): void {
    // all@price broadcasts EVERY symbol; ignore anything we don't track
    if (!this.subscribedSymbols.has(update.symbol)) return;

    const existing = this.marketData.get(update.symbol);

    const newData: MarketData = {
      symbol: update.symbol,
      price: update.price,
      bid: existing?.bid,
      ask: existing?.ask,
      high24h: existing?.high24h,
      low24h: existing?.low24h,
      volume24h: existing?.volume24h,
      change24h: update.change24h,
      lastUpdate: Date.now(),
      source: 'websocket',
    };

    this.marketData.set(update.symbol, newData);
    this.emit('price.update', newData);

    logger.debug({ symbol: update.symbol, price: update.price }, 'Price updated');
  }

  /**
   * Update last price from a trade tick
   */
  private updateTrade(update: TradeUpdate): void {
    if (!this.subscribedSymbols.has(update.symbol)) return;

    const existing = this.marketData.get(update.symbol);

    const newData: MarketData = {
      symbol: update.symbol,
      price: update.price,
      bid: existing?.bid,
      ask: existing?.ask,
      high24h: existing?.high24h,
      low24h: existing?.low24h,
      volume24h: existing?.volume24h,
      change24h: existing?.change24h,
      lastUpdate: Date.now(),
      source: 'websocket',
    };

    this.marketData.set(update.symbol, newData);
    this.emit('price.update', newData);
  }

  /**
   * Update depth from WebSocket
   */
  private updateDepth(update: DepthUpdate & { symbol?: string }): void {
    if (!update.symbol) return;

    const existing = this.marketData.get(update.symbol);
    const bestBid = update.bids.length > 0 ? update.bids[0].price : undefined;
    const bestAsk = update.asks.length > 0 ? update.asks[0].price : undefined;

    const newData: MarketData = {
      symbol: update.symbol,
      price: existing?.price || bestBid || bestAsk || '',
      bid: bestBid,
      ask: bestAsk,
      high24h: existing?.high24h,
      low24h: existing?.low24h,
      volume24h: existing?.volume24h,
      change24h: existing?.change24h,
      lastUpdate: Date.now(),
      source: 'websocket',
    };

    this.marketData.set(update.symbol, newData);
    this.emit('depth.update', newData);

    logger.debug({ symbol: update.symbol, bid: bestBid, ask: bestAsk }, 'Depth updated');
  }

  /**
   * Start REST polling for a symbol
   */
  private startPolling(symbol: string): void {
    if (this.pollTimers.has(symbol)) {
      return;
    }

    logger.info({ symbol }, 'Starting REST polling');

    // Initial fetch
    this.pollSymbol(symbol);

    // Set up interval
    const timer = setInterval(() => {
      this.pollSymbol(symbol);
    }, this.config.pollIntervalMs);

    this.pollTimers.set(symbol, timer);
  }

  /**
   * Stop REST polling for a symbol
   */
  private stopPolling(symbol: string): void {
    const timer = this.pollTimers.get(symbol);
    if (timer) {
      clearInterval(timer);
      this.pollTimers.delete(symbol);
      logger.debug({ symbol }, 'Stopped REST polling');
    }
  }

  /**
   * Poll symbol data from REST API
   */
  private async pollSymbol(symbol: string): Promise<void> {
    try {
      // Get depth for bid/ask
      const depth = await this.config.restClient.getDepth(symbol);

      const bestBid = depth.bid?.length > 0 ? depth.bid[0].price : undefined;
      const bestAsk = depth.ask?.length > 0 ? depth.ask[0].price : undefined;

      const existing = this.marketData.get(symbol);

      let price = existing?.price || '';
      if (bestBid && bestAsk) {
        price = String((Number(bestBid) + Number(bestAsk)) / 2);
      } else if (bestBid || bestAsk) {
        price = bestBid || bestAsk || price;
      }

      const newData: MarketData = {
        symbol,
        price,
        bid: bestBid,
        ask: bestAsk,
        high24h: existing?.high24h,
        low24h: existing?.low24h,
        volume24h: existing?.volume24h,
        change24h: existing?.change24h,
        lastUpdate: Date.now(),
        source: 'rest',
      };

      this.marketData.set(symbol, newData);
      this.emit('price.update', newData);

      logger.trace({ symbol, price: newData.price }, 'Polled market data');
    } catch (error) {
      logger.error({ symbol, error }, 'Failed to poll market data');
    }
  }

  /**
   * Clear all data and stop polling
   */
  clear(): void {
    this.pollTimers.forEach((timer) => clearInterval(timer));
    this.pollTimers.clear();
    this.subscribedSymbols.clear();
    this.marketData.clear();
    logger.info('Market data service cleared');
  }
}

export default MarketDataService;
