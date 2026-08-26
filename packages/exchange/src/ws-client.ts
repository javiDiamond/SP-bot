/**
 * Wallex WebSocket Client
 * 
 * Implements WebSocket connection to Wallex with:
 * - Automatic reconnection
 * - Channel subscription management
 * - Ping/Pong handling
 * - Connection lifecycle management
 */

import EventEmitter from 'events';
import WebSocket from 'isomorphic-ws';
import pino from 'pino';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface WallexWsConfig {
  url: string;
  streamKey?: string;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  pingTimeout?: number;
  reconnectBeforeDisconnectMs?: number;
}

export type WsChannel = 
  | `${string}@buyDepth`
  | `${string}@sellDepth`
  | `${string}@trade`
  | 'all@price'
  | string; // For private channels with stream key

export interface WsMessage {
  channel?: string;
  event?: string;
  data?: any;
  [key: string]: any;
}

export interface SubscriptionEvent {
  channel: string;
  subscribed: boolean;
  timestamp: number;
}

export interface PriceUpdate {
  symbol: string;
  price: string;
  change24h: number;
}

export interface DepthUpdate {
  bids: Array<{ price: string; quantity: string; sum: string }>;
  asks: Array<{ price: string; quantity: string; sum: string }>;
}

export interface TradeUpdate {
  symbol: string;
  isBuyOrder: boolean;
  quantity: string;
  price: string;
  timestamp: string;
}

export interface BalanceUpdate {
  asset: string;
  value: string;
  locked: string;
}

export interface OrderUpdate {
  symbol: string;
  side: 'BUY' | 'SELL';
  clientOrderId: string;
  price: string;
  quantity: string;
  executedQty: string;
  status: string;
  active: boolean;
}

export interface TradeDetail {
  clientOrderID: string;
  feeAmount: string;
  feeCurrency: string;
  isMaker: boolean;
  price: string;
  quantity: string;
  side: 'BUY' | 'SELL';
  sum: string;
  symbol: string;
}

// ============================================================================
// Logger
// ============================================================================

const logger = pino({ name: 'wallex-ws' });

// ============================================================================
// Wallex WebSocket Client
// ============================================================================

export class WallexWebSocketClient extends EventEmitter {
  private config: Required<WallexWsConfig>;
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private isReconnecting: boolean = false;
  private subscriptions: Set<string> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionStartTime: number = 0;
  private pongCount: number = 0;
  private reconnectAttempts: number = 0;
  private readonly MAX_PONG_COUNT = 100;
  private readonly PING_INTERVAL_MS = 20000; // Server sends PING every 20s
  private readonly RECONNECT_BEFORE_DISCONNECT_MS = 25 * 60 * 1000; // 25 minutes

  constructor(config: WallexWsConfig) {
    super();
    this.config = {
      url: config.url || process.env.WALLEX_WS_URL || 'wss://api.wallex.ir/ws',
      streamKey: config.streamKey || process.env.WALLEX_STREAM_KEY || '',
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectInterval: config.maxReconnectInterval || 60000,
      pingTimeout: config.pingTimeout || 30000,
      reconnectBeforeDisconnectMs: config.reconnectBeforeDisconnectMs || this.RECONNECT_BEFORE_DISCONNECT_MS,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws && this.isConnected) {
      logger.warn('Already connected');
      return;
    }

    logger.info({ url: this.config.url }, 'Connecting to WebSocket');
    this.emit('ws.connecting');

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onclose = (event) => this.handleClose(event);
      this.ws.onerror = (error) => this.handleError(error);

      this.connectionStartTime = Date.now();
    } catch (error) {
      logger.error({ error }, 'Failed to create WebSocket');
      this.emit('ws.error', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    logger.info('Disconnecting WebSocket');
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isReconnecting = false;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.subscriptions.clear();
    this.emit('ws.disconnected');
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string): void {
    if (!this.isConnected) {
      logger.warn({ channel }, 'Cannot subscribe, not connected');
      return;
    }

    if (this.subscriptions.has(channel)) {
      logger.debug({ channel }, 'Already subscribed');
      return;
    }

    const message = ['subscribe', { channel }];
    this.send(message);
    this.subscriptions.add(channel);
    
    logger.info({ channel }, 'Subscribed to channel');
    this.emit('subscription', { channel, subscribed: true, timestamp: Date.now() });
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string): void {
    if (!this.isConnected) {
      return;
    }

    const message = ['unsubscribe', { channel }];
    this.send(message);
    this.subscriptions.delete(channel);
    
    logger.info({ channel }, 'Unsubscribed from channel');
    this.emit('subscription', { channel, subscribed: false, timestamp: Date.now() });
  }

  /**
   * Subscribe to market depth (buy side)
   */
  subscribeBuyDepth(symbol: string): void {
    this.subscribe(`${symbol}@buyDepth`);
  }

  /**
   * Subscribe to market depth (sell side)
   */
  subscribeSellDepth(symbol: string): void {
    this.subscribe(`${symbol}@sellDepth`);
  }

  /**
   * Subscribe to market trades
   */
  subscribeTrades(symbol: string): void {
    this.subscribe(`${symbol}@trade`);
  }

  /**
   * Subscribe to all prices
   */
  subscribeAllPrices(): void {
    this.subscribe('all@price');
  }

  /**
   * Subscribe to private balance updates
   */
  subscribeBalanceUpdates(): void {
    if (this.config.streamKey) {
      this.subscribe(this.config.streamKey);
    } else {
      logger.warn('No stream key configured, cannot subscribe to private channels');
    }
  }

  /**
   * Subscribe to private trade details
   */
  subscribeTradeDetails(): void {
    if (this.config.streamKey) {
      this.subscribe(`${this.config.streamKey}@tradeDetails`);
    } else {
      logger.warn('No stream key configured, cannot subscribe to trade details');
    }
  }

  /**
   * Resubscribe to all channels after reconnect
   */
  private resubscribeAll(): void {
    logger.info({ count: this.subscriptions.size }, 'Resubscribing to channels');
    
    const channels = Array.from(this.subscriptions);
    this.subscriptions.clear();
    
    channels.forEach(channel => {
      this.subscribe(channel);
    });
  }

  /**
   * Send message to WebSocket server
   */
  private send(message: any): void {
    if (!this.ws || !this.isConnected) {
      logger.warn('Cannot send message, not connected');
      return;
    }

    try {
      const messageStr = JSON.stringify(message);
      this.ws.send(messageStr);
      logger.debug({ message }, 'Sent message');
    } catch (error) {
      logger.error({ error, message }, 'Failed to send message');
      this.emit('ws.error', error);
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    logger.info('WebSocket connected');
    this.isConnected = true;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.pongCount = 0;
    
    this.emit('ws.connected');
    
    // Resubscribe to channels
    this.resubscribeAll();
    
    // Start ping handler
    this.startPingHandler();
    
    // Schedule proactive reconnect before 30-minute limit
    this.scheduleProactiveReconnect();
  }

  /**
   * Handle WebSocket message
   */
  private handleMessage(event: WebSocket.MessageEvent): void {
    try {
      const data = JSON.parse(event.data as string);
      logger.debug({ data }, 'Received message');
      
      this.processMessage(data);
    } catch (error) {
      logger.error({ error, raw: event.data }, 'Failed to parse message');
    }
  }

  /**
   * Process incoming WebSocket message
   */
  private processMessage(data: any): void {
    // Handle server PING - respond with PONG
    if (data === 'PING' || (Array.isArray(data) && data[0] === 'PING')) {
      this.handlePing();
      return;
    }

    // Parse array format messages [channel, data]
    if (Array.isArray(data) && data.length >= 2) {
      const [channel, payload] = data;
      
      if (typeof channel === 'string') {
        this.handleChannelMessage(channel, payload);
        return;
      }
    }

    // Handle object format messages
    if (typeof data === 'object' && data.event) {
      this.handleEventMessage(data);
      return;
    }

    logger.debug({ data }, 'Unknown message format');
  }

  /**
   * Handle channel-specific messages
   */
  private handleChannelMessage(channel: string, payload: any): void {
    // Handle buy/sell depth
    if (channel.endsWith('@buyDepth') || channel.endsWith('@sellDepth')) {
      const symbol = channel.replace('@buyDepth', '').replace('@sellDepth', '');
      const isBuy = channel.endsWith('@buyDepth');
      
      const depthData = Array.isArray(payload) ? payload : [];
      
      this.emit('depth.update', {
        symbol,
        bids: isBuy ? depthData : [],
        asks: isBuy ? [] : depthData,
      } as DepthUpdate);
      
      return;
    }

    // Handle trade messages
    if (channel.endsWith('@trade')) {
      const symbol = channel.replace('@trade', '');
      
      this.emit('trade.update', {
        symbol,
        isBuyOrder: payload.isBuyOrder,
        quantity: String(payload.quantity),
        price: String(payload.price),
        timestamp: payload.timestamp,
      } as TradeUpdate);
      
      return;
    }

    // Handle all@price
    if (channel === 'all@price') {
      this.emit('price.update', {
        symbol: payload.symbol,
        price: String(payload.price),
        change24h: payload['24h_ch'] || 0,
      } as PriceUpdate);
      
      return;
    }

    logger.debug({ channel, payload }, 'Unhandled channel message');
  }

  /**
   * Handle event messages (private channels)
   */
  private handleEventMessage(data: any): void {
    const { event } = data;
    
    switch (event) {
      case 'balanceUpdated':
        this.handleBalanceUpdate(data);
        break;
        
      case 'orderSaved':
        this.handleOrderUpdate(data);
        break;
        
      case 'tradeDetails':
        this.handleTradeDetail(data);
        break;
        
      default:
        logger.debug({ event, data }, 'Unknown event type');
    }
  }

  /**
   * Handle balance update event
   */
  private handleBalanceUpdate(data: any): void {
    const balances = data.data || {};
    
    Object.entries(balances).forEach(([asset, balance]: [string, any]) => {
      this.emit('balance.update', {
        asset,
        value: String(balance.value),
        locked: String(balance.locked),
      } as BalanceUpdate);
    });
  }

  /**
   * Handle order update event
   */
  private handleOrderUpdate(data: any): void {
    const order = data.data || {};
    
    this.emit('order.update', {
      symbol: order.symbol,
      side: order.side as 'BUY' | 'SELL',
      clientOrderId: order.clientOrderId,
      price: String(order.price),
      quantity: String(order.origQty),
      executedQty: String(order.executedQty),
      status: order.status,
      active: order.active,
    } as OrderUpdate);
  }

  /**
   * Handle trade detail event
   */
  private handleTradeDetail(data: any): void {
    const trade = data.data || {};
    
    this.emit('trade.detail', {
      clientOrderID: trade.clientOrderID,
      feeAmount: String(trade.feeAmount),
      feeCurrency: trade.feeCurrency,
      isMaker: trade.isMaker,
      price: String(trade.price),
      quantity: String(trade.quantity),
      side: trade.side as 'BUY' | 'SELL',
      sum: String(trade.sum),
      symbol: trade.symbol,
    } as TradeDetail);
  }

  /**
   * Handle server PING - respond with PONG
   */
  private handlePing(): void {
    if (this.pongCount >= this.MAX_PONG_COUNT) {
      logger.warn('Max PONG count reached, reconnecting');
      this.forceReconnect('pong-cap');
      return;
    }

    this.send('PONG');
    this.pongCount++;
    
    logger.debug({ pongCount: this.pongCount }, 'Sent PONG');
  }

  /**
   * Start ping interval handler
   */
  private startPingHandler(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (!this.isConnected) {
        clearInterval(this.pingInterval!);
        return;
      }

      // Check if we should proactively reconnect
      const connectionAge = Date.now() - this.connectionStartTime;
      if (connectionAge > this.config.reconnectBeforeDisconnectMs) {
        logger.info('Connection age exceeded threshold, reconnecting');
        this.scheduleReconnect();
      }
    }, this.PING_INTERVAL_MS);
  }

  /**
   * Schedule proactive reconnect before 30-minute limit
   */
  private scheduleProactiveReconnect(): void {
    const delay = this.config.reconnectBeforeDisconnectMs;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      if (this.isConnected) {
        logger.info('Proactive reconnect triggered');
        this.forceReconnect('proactive');
      }
    }, delay);
  }

  /**
   * Force a reconnect: close the live socket with a non-1000 code so
   * handleClose triggers the backoff reconnect, or schedule directly
   * if already disconnected.
   */
  private forceReconnect(reason: string): void {
    if (this.ws && this.isConnected) {
      this.ws.close(4000, `forced reconnect: ${reason}`);
    } else {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: WebSocket.CloseEvent): void {
    logger.info({ code: event.code, reason: event.reason }, 'WebSocket closed');
    
    this.isConnected = false;
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.emit('ws.disconnected');

    // Auto-reconnect unless explicitly disconnected
    if (!this.isReconnecting && event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(error: any): void {
    logger.error({ error }, 'WebSocket error');
    this.emit('ws.error', error);
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.isReconnecting) {
      return;
    }

    this.isReconnecting = true;
    
    const baseDelay = this.config.reconnectInterval;
    const maxDelay = this.config.maxReconnectInterval;
    
    // Exponential backoff with jitter based on real attempt counter
    const attempt = this.reconnectAttempts;
    this.reconnectAttempts += 1;
    const delay = Math.min(baseDelay * Math.pow(2, attempt) + Math.random() * 1000, maxDelay);
    
    logger.info({ delay, attempt: this.reconnectAttempts }, 'Scheduling reconnect');
    
    this.emit('ws.reconnecting', { attempt: this.reconnectAttempts, delay });

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      logger.info('Attempting reconnect');
      // Allow a fresh scheduleReconnect if this attempt fails
      this.isReconnecting = false;
      this.connect();
    }, delay);
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get current subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }
}

export default WallexWebSocketClient;
