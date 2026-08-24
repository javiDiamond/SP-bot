/**
 * Unified Wallex Exchange Adapter
 * 
 * Provides a single interface that switches between:
 * - Live trading via Wallex REST API
 * - Paper trading via simulator
 */

import { WallexRestClient, WallexOrderRequest, WallexOpenOrder } from './rest-client';
import { PaperExchange } from './paper-exchange';
import { logger } from '@wallex/shared';
import Decimal from 'decimal.js';

export enum ExchangeMode {
  LIVE = 'LIVE',
  DRY_RUN = 'DRY_RUN',
}

export interface WallexExchangeConfig {
  apiKey: string;
  mode: ExchangeMode;
  symbol: string;
  initialBalances?: Record<string, string>;
}

export interface Ticker {
  symbol: string;
  lastPrice: string;
  bidPrice?: string;
  askPrice?: string;
  high24h?: string;
  low24h?: string;
  volume24h?: string;
}

export interface OrderResult {
  orderId: string;
  clientId?: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET';
  price: string;
  quantity: string;
  status: 'NEW' | 'PENDING' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED';
}

export interface CancelResult {
  orderId: string;
  clientId?: string;
  status: 'CANCELED' | 'REJECTED';
}

export class WallexExchange {
  private mode: ExchangeMode;
  private symbol: string;
  private restClient?: WallexRestClient;
  private paperExchange?: PaperExchange;

  constructor(config: WallexExchangeConfig) {
    this.mode = config.mode;
    this.symbol = config.symbol;

    if (config.mode === ExchangeMode.LIVE) {
      this.restClient = new WallexRestClient({
        apiKey: config.apiKey,
        baseUrl: process.env.WALLEX_API_BASE_URL || 'https://api.wallex.ir',
      });
      logger.info('Initialized WallexExchange in LIVE mode');
    } else {
      this.paperExchange = new PaperExchange({
        initialBalances: config.initialBalances || {
          USDT: '10000',
          TMN: '1000000000',
        },
        symbol: config.symbol,
      });
      logger.info('Initialized WallexExchange in DRY_RUN mode');
    }
  }

  async getMarket(symbol: string) {
    if (this.mode === ExchangeMode.LIVE) {
      return this.restClient!.getMarket(symbol);
    } else {
      return this.paperExchange.getMarket(symbol);
    }
  }

  async getTicker(symbol: string): Promise<Ticker | null> {
    if (this.mode === ExchangeMode.LIVE) {
      const market = await this.restClient!.getMarket(symbol);
      if (!market) return null;
      
      return {
        symbol,
        lastPrice: market.price.toString(),
        high24h: market.volume24h?.toString(),
        low24h: market.volume24h?.toString(),
      };
    } else {
      return this.paperExchange.getTicker(symbol);
    }
  }

  async getFees(symbol: string) {
    if (this.mode === ExchangeMode.LIVE) {
      return this.restClient!.getFees(symbol);
    } else {
      return this.paperExchange.getFees(symbol);
    }
  }

  async placeOrder(request: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET';
    price: string;
    quantity: string;
    clientOrderId: string;
  }): Promise<OrderResult> {
    if (this.mode === ExchangeMode.LIVE) {
      const orderRequest: WallexOrderRequest = {
        symbol: request.symbol,
        side: request.side,
        type: request.type,
        price: request.price,
        quantity: request.quantity,
        client_id: request.clientOrderId,
      };

      const response = await this.restClient!.createOrder(orderRequest);
      
      return {
        orderId: response.orderId,
        clientId: response.clientOrderId,
        symbol: response.symbol,
        side: response.side as 'BUY' | 'SELL',
        type: response.type as any,
        price: response.price.toString(),
        quantity: response.quantity.toString(),
        status: response.status as any,
      };
    } else {
      return this.paperExchange!.placeOrder(request);
    }
  }

  async cancelOrder(clientOrderId: string): Promise<CancelResult> {
    if (this.mode === ExchangeMode.LIVE) {
      await this.restClient!.cancelOrder(clientOrderId);
      
      return {
        orderId: clientOrderId,
        status: 'CANCELED',
      };
    } else {
      return this.paperExchange!.cancelOrder(clientOrderId);
    }
  }

  async getOpenOrders(symbol: string): Promise<WallexOpenOrder[]> {
    if (this.mode === ExchangeMode.LIVE) {
      return this.restClient!.getOpenOrders(symbol);
    } else {
      const orders = this.paperExchange!.getOpenOrders(symbol);
      return orders as WallexOpenOrder[];
    }
  }

  async getBalances() {
    if (this.mode === ExchangeMode.LIVE) {
      return this.restClient!.getBalances();
    } else {
      return this.paperExchange!.getBalances();
    }
  }
}
