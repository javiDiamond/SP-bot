// Shared type definitions

export enum TradingMode {
  DRY_RUN = 'DRY_RUN',
  LIVE = 'LIVE',
}

export enum GridType {
  ARITHMETIC = 'ARITHMETIC',
  GEOMETRIC = 'GEOMETRIC',
}

export enum BotStatus {
  DRAFT = 'DRAFT',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  PAUSING = 'PAUSING',
  PAUSED = 'PAUSED',
  STOPPING = 'STOPPING',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR',
  RANGE_EXITED = 'RANGE_EXITED',
  KILLED = 'KILLED',
}

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderType {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET',
  STOP_LIMIT = 'STOP_LIMIT',
  STOP_MARKET = 'STOP_MARKET',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  NEW = 'NEW',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  CANCELED = 'CANCELED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  UNKNOWN = 'UNKNOWN',
}

export enum GridLevelStatus {
  IDLE = 'IDLE',
  BUY_ORDER_OPEN = 'BUY_ORDER_OPEN',
  BUY_PARTIALLY_FILLED = 'BUY_PARTIALLY_FILLED',
  BUY_FILLED = 'BUY_FILLED',
  SELL_ORDER_OPEN = 'SELL_ORDER_OPEN',
  SELL_PARTIALLY_FILLED = 'SELL_PARTIALLY_FILLED',
  SELL_FILLED = 'SELL_FILLED',
  ERROR = 'ERROR',
}

export enum BacktestStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface GridConfig {
  gridType: GridType;
  lowerPrice: string;
  upperPrice: string;
  gridCount: number;
  totalInvestmentQuote?: string;
  quotePerGrid?: string;
  basePerGrid?: string;
  inventoryMode: 'EXISTING_ONLY' | 'AUTO_REBALANCE' | 'MANUAL';
  makerOnly: boolean;
  minProfitAfterFeesBps: number;
  onRangeExit: 'PAUSE_KEEP_ORDERS' | 'PAUSE_CANCEL_ALL' | 'STOP_CANCEL_ALL' | 'RECENTER' | 'TRAILING';
  autoRecenter: boolean;
  recenterThresholdPercent?: number;
  recenterCooldownMinutes?: number;
  stopLossPrice?: string;
  takeProfitPrice?: string;
  maxOpenOrders?: number;
  maxQuoteExposure?: string;
  maxBaseExposure?: string;
  dailyLossLimitPercent?: number;
  allowMarketOrders: boolean;
}

export interface GridLevel {
  levelIndex: number;
  price: string;
  status: GridLevelStatus;
  buyOrderId?: string;
  sellOrderId?: string;
  filledQuantity: string;
  averageCost?: string;
}

export interface MarketData {
  symbol: string;
  lastPrice: string;
  bestBid?: string;
  bestAsk?: string;
  timestamp: number;
}

export interface Candle {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface Balance {
  asset: string;
  total: string;
  available: string;
  locked: string;
}

export interface WallexFee {
  symbol: string;
  makerFeeRate: string;
  takerFeeRate: string;
}
