export type BotStatus =
  | 'DRAFT'
  | 'STARTING'
  | 'RUNNING'
  | 'PAUSING'
  | 'PAUSED'
  | 'STOPPING'
  | 'STOPPED'
  | 'ERROR'
  | 'RANGE_EXITED'
  | 'KILLED';

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'LIMIT' | 'MARKET' | 'STOP_LIMIT' | 'STOP_MARKET';
export type OrderStatus =
  | 'PENDING'
  | 'NEW'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'UNKNOWN';

export type GridLevelStatus =
  | 'IDLE'
  | 'BUY_ORDER_OPEN'
  | 'BUY_PARTIALLY_FILLED'
  | 'BUY_FILLED'
  | 'SELL_ORDER_OPEN'
  | 'SELL_PARTIALLY_FILLED'
  | 'SELL_FILLED'
  | 'ERROR';

export interface GridConfig {
  gridType: 'ARITHMETIC' | 'GEOMETRIC';
  lowerPrice: string;
  upperPrice: string;
  gridCount: number;
  totalInvestmentQuote?: string;
  quotePerGrid?: string;
  basePerGrid?: string;
  inventoryMode: 'EXISTING_ONLY' | 'AUTO_REBALANCE' | 'MANUAL';
  makerOnly: boolean;
  minProfitAfterFeesBps: number;
  onRangeExit:
    | 'PAUSE_KEEP_ORDERS'
    | 'PAUSE_CANCEL_ALL'
    | 'STOP_CANCEL_ALL'
    | 'RECENTER'
    | 'TRAILING';
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

export interface GridLevelRow {
  id: string;
  botId: string;
  levelIndex: number;
  price: string;
  status: GridLevelStatus;
  buyOrderId?: string | null;
  sellOrderId?: string | null;
  filledQuantity: string;
  averageCost?: string | null;
}

export interface FillRow {
  id: string;
  botId: string;
  orderId: string;
  fillId?: string | null;
  price: string;
  quantity: string;
  sum: string;
  fee: string;
  feeAsset?: string | null;
  isBuyer: boolean;
  isMaker?: boolean | null;
  isDryRun: boolean;
  timestamp: string;
  side?: OrderSide;
  symbol?: string;
  order?: { symbol?: string; side?: OrderSide; clientOrderId?: string };
}

export interface OrderRow {
  id: string;
  botId: string;
  clientOrderId: string;
  exchangeOrderId?: string | null;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  price: string;
  quantity: string;
  executedQty: string;
  executedSum: string;
  fee: string;
  feeAsset?: string | null;
  isDryRun: boolean;
  createdAt: string;
  updatedAt: string;
  executedAt?: string | null;
  fills?: FillRow[];
}

export interface PnLSnapshotRow {
  id: string;
  botId: string;
  realizedPnL: string;
  unrealizedPnL: string;
  totalPnL: string;
  feesPaid: string;
  baseBalance: string;
  quoteBalance: string;
  timestamp: string;
}

export interface BotRow {
  id: string;
  userId: string;
  exchangeAccountId?: string | null;
  name: string;
  symbol: string;
  strategyType: 'GRID';
  mode: 'DRY_RUN' | 'LIVE';
  status: BotStatus;
  gridConfig: GridConfig;
  runtimeState?: unknown;
  maxQuoteExposure?: string | null;
  maxBaseExposure?: string | null;
  dailyLossLimitPercent?: string | null;
  realizedPnL: string;
  unrealizedPnL: string;
  totalFeesPaid: string;
  totalBuys: number;
  totalSells: number;
  totalGridCycles: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  stoppedAt?: string | null;
  gridLevels?: GridLevelRow[];
  orders?: OrderRow[];
  fills?: FillRow[];
  pnlSnapshots?: PnLSnapshotRow[];
}

export interface MarketRow {
  id?: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  isSpot: boolean;
  amountPrecision: number;
  pricePrecision: number;
  minNotional?: string | null;
  isActive?: boolean;
  lastPrice?: string | null;
  volume24h?: string | null;
}

export interface ExchangeAccountRow {
  id: string;
  name: string;
  apiKeyMasked: string;
  subAccountClientId?: string | null;
  isLiveEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceSnapshotRow {
  id: string;
  exchangeAccountId?: string | null;
  botId?: string | null;
  asset: string;
  total: string;
  available: string;
  locked: string;
  isDryRun: boolean;
  timestamp: string;
}

export interface BacktestMetrics {
  finalRealizedPnL: string;
  finalUnrealizedPnL: string;
  totalPnL: string;
  totalFees: string;
  totalBuys: number;
  totalSells: number;
  gridCycles: number;
  maxDrawdownPct: string;
  winRatePct: string;
  gridProfitPct: string;
  buyAndHoldPct: string;
  startEquity: string;
  endEquity: string;
}

export interface BacktestResults {
  metrics?: BacktestMetrics;
  equityCurve?: Array<{ timestamp: number; equity: string; price: string }>;
  warnings?: string[];
  candlesProcessed?: number;
}

export interface BacktestRow {
  id: string;
  userId: string;
  name: string;
  symbol: string;
  dateFrom: string;
  dateTo: string;
  resolution: string;
  config: { config?: GridConfig } & GridConfig;
  results?: BacktestResults | null;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  error?: string | null;
  optimizationId?: string | null;
  createdAt: string;
  completedAt?: string | null;
  tradeCount?: number;
  trades?: BacktestTradeRow[];
}

export interface BacktestTradeRow {
  id: string;
  timestamp: string;
  side: OrderSide;
  price: string;
  quantity: string;
  fee: string;
  pnl: string;
}

export interface RiskSettingRow {
  id: string;
  key: string;
  maxBotsGlobal: number;
  maxBotsPerSymbol: number;
  maxDailyLossPercent: string;
  maxQuoteExposureGlobal: string;
  killSwitchActive: boolean;
  allowLiveTrading: boolean;
  updatedAt: string;
}

export interface SystemStatusData {
  services: { database: boolean; redis: boolean; worker: unknown };
  queues: string[];
  counts: { runningBots: number; pausedBots: number; pendingBacktests: number };
  riskSettings: RiskSettingRow;
  liveTradingEnv: boolean;
}

export interface EventLogRow {
  id: string;
  botId?: string | null;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  event: string;
  message: string;
  data?: unknown;
  createdAt: string;
}

export interface AuditLogRow {
  id: string;
  userId: string;
  action: string;
  resource?: string | null;
  resourceId?: string | null;
  ipAddress?: string | null;
  data?: unknown;
  createdAt: string;
  user?: { email: string } | null;
}

export interface OptimizationRow {
  id: string;
  symbol: string;
  dateFrom: string;
  dateTo: string;
  resolution: string;
  config: unknown;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  maxCombos: number;
  bestResult?: unknown;
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
  backtests?: Array<Pick<BacktestRow, 'id' | 'name' | 'status'> & { results?: BacktestResults | null }>;
}

export interface UserRow {
  id: string;
  email: string;
  role: 'ADMIN' | 'TRADER' | 'VIEWER';
}

export interface CandleRow {
  id: string;
  timestamp: string;
  resolution: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface RealtimeMessage {
  channel: string;
  type:
    | 'bot.status'
    | 'bot.stats'
    | 'order.update'
    | 'fill.new'
    | 'killswitch.changed'
    | 'price.stale'
    | 'backtest.progress'
    | 'reconciliation.report';
  payload: any;
  ts: number;
}
