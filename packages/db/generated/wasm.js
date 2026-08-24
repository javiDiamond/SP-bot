
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  passwordHash: 'passwordHash',
  role: 'role',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ExchangeAccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  name: 'name',
  apiKeyEncrypted: 'apiKeyEncrypted',
  apiIv: 'apiIv',
  apiAuthTag: 'apiAuthTag',
  subAccountClientId: 'subAccountClientId',
  isLiveEnabled: 'isLiveEnabled',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BotScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  exchangeAccountId: 'exchangeAccountId',
  name: 'name',
  symbol: 'symbol',
  strategyType: 'strategyType',
  mode: 'mode',
  status: 'status',
  gridConfig: 'gridConfig',
  runtimeState: 'runtimeState',
  maxQuoteExposure: 'maxQuoteExposure',
  maxBaseExposure: 'maxBaseExposure',
  dailyLossLimitPercent: 'dailyLossLimitPercent',
  realizedPnL: 'realizedPnL',
  unrealizedPnL: 'unrealizedPnL',
  totalFeesPaid: 'totalFeesPaid',
  totalBuys: 'totalBuys',
  totalSells: 'totalSells',
  totalGridCycles: 'totalGridCycles',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  startedAt: 'startedAt',
  stoppedAt: 'stoppedAt'
};

exports.Prisma.GridLevelScalarFieldEnum = {
  id: 'id',
  botId: 'botId',
  levelIndex: 'levelIndex',
  price: 'price',
  status: 'status',
  buyOrderId: 'buyOrderId',
  sellOrderId: 'sellOrderId',
  filledQuantity: 'filledQuantity',
  averageCost: 'averageCost',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  botId: 'botId',
  clientOrderId: 'clientOrderId',
  exchangeOrderId: 'exchangeOrderId',
  symbol: 'symbol',
  side: 'side',
  type: 'type',
  status: 'status',
  price: 'price',
  quantity: 'quantity',
  executedQty: 'executedQty',
  executedSum: 'executedSum',
  fee: 'fee',
  feeAsset: 'feeAsset',
  isDryRun: 'isDryRun',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  executedAt: 'executedAt'
};

exports.Prisma.FillScalarFieldEnum = {
  id: 'id',
  botId: 'botId',
  orderId: 'orderId',
  fillId: 'fillId',
  price: 'price',
  quantity: 'quantity',
  sum: 'sum',
  fee: 'fee',
  feeAsset: 'feeAsset',
  isBuyer: 'isBuyer',
  isMaker: 'isMaker',
  isDryRun: 'isDryRun',
  timestamp: 'timestamp'
};

exports.Prisma.MarketScalarFieldEnum = {
  id: 'id',
  symbol: 'symbol',
  baseAsset: 'baseAsset',
  quoteAsset: 'quoteAsset',
  isSpot: 'isSpot',
  isTmnBased: 'isTmnBased',
  isUsdtBased: 'isUsdtBased',
  amountPrecision: 'amountPrecision',
  pricePrecision: 'pricePrecision',
  minNotional: 'minNotional',
  isActive: 'isActive',
  lastPrice: 'lastPrice',
  volume24h: 'volume24h',
  updatedAt: 'updatedAt'
};

exports.Prisma.CandleScalarFieldEnum = {
  id: 'id',
  marketId: 'marketId',
  timestamp: 'timestamp',
  resolution: 'resolution',
  open: 'open',
  high: 'high',
  low: 'low',
  close: 'close',
  volume: 'volume'
};

exports.Prisma.BalanceSnapshotScalarFieldEnum = {
  id: 'id',
  exchangeAccountId: 'exchangeAccountId',
  botId: 'botId',
  asset: 'asset',
  total: 'total',
  available: 'available',
  locked: 'locked',
  isDryRun: 'isDryRun',
  timestamp: 'timestamp'
};

exports.Prisma.PnLSnapshotScalarFieldEnum = {
  id: 'id',
  botId: 'botId',
  realizedPnL: 'realizedPnL',
  unrealizedPnL: 'unrealizedPnL',
  totalPnL: 'totalPnL',
  feesPaid: 'feesPaid',
  baseBalance: 'baseBalance',
  quoteBalance: 'quoteBalance',
  timestamp: 'timestamp'
};

exports.Prisma.BacktestScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  name: 'name',
  symbol: 'symbol',
  dateFrom: 'dateFrom',
  dateTo: 'dateTo',
  resolution: 'resolution',
  config: 'config',
  results: 'results',
  status: 'status',
  createdAt: 'createdAt',
  completedAt: 'completedAt'
};

exports.Prisma.BacktestTradeScalarFieldEnum = {
  id: 'id',
  backtestId: 'backtestId',
  timestamp: 'timestamp',
  side: 'side',
  price: 'price',
  quantity: 'quantity',
  fee: 'fee',
  pnl: 'pnl'
};

exports.Prisma.SystemSettingScalarFieldEnum = {
  key: 'key',
  value: 'value',
  updatedAt: 'updatedAt'
};

exports.Prisma.EventLogScalarFieldEnum = {
  id: 'id',
  botId: 'botId',
  level: 'level',
  event: 'event',
  message: 'message',
  data: 'data',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  action: 'action',
  resource: 'resource',
  resourceId: 'resourceId',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  data: 'data',
  createdAt: 'createdAt'
};

exports.Prisma.RiskSettingScalarFieldEnum = {
  id: 'id',
  key: 'key',
  maxBotsGlobal: 'maxBotsGlobal',
  maxBotsPerSymbol: 'maxBotsPerSymbol',
  maxDailyLossPercent: 'maxDailyLossPercent',
  maxQuoteExposureGlobal: 'maxQuoteExposureGlobal',
  killSwitchActive: 'killSwitchActive',
  allowLiveTrading: 'allowLiveTrading',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserRole = exports.$Enums.UserRole = {
  ADMIN: 'ADMIN',
  TRADER: 'TRADER',
  VIEWER: 'VIEWER'
};

exports.StrategyType = exports.$Enums.StrategyType = {
  GRID: 'GRID'
};

exports.TradingMode = exports.$Enums.TradingMode = {
  DRY_RUN: 'DRY_RUN',
  LIVE: 'LIVE'
};

exports.BotStatus = exports.$Enums.BotStatus = {
  DRAFT: 'DRAFT',
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  PAUSING: 'PAUSING',
  PAUSED: 'PAUSED',
  STOPPING: 'STOPPING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR',
  RANGE_EXITED: 'RANGE_EXITED',
  KILLED: 'KILLED'
};

exports.GridLevelStatus = exports.$Enums.GridLevelStatus = {
  IDLE: 'IDLE',
  BUY_ORDER_OPEN: 'BUY_ORDER_OPEN',
  BUY_PARTIALLY_FILLED: 'BUY_PARTIALLY_FILLED',
  BUY_FILLED: 'BUY_FILLED',
  SELL_ORDER_OPEN: 'SELL_ORDER_OPEN',
  SELL_PARTIALLY_FILLED: 'SELL_PARTIALLY_FILLED',
  SELL_FILLED: 'SELL_FILLED',
  ERROR: 'ERROR'
};

exports.OrderSide = exports.$Enums.OrderSide = {
  BUY: 'BUY',
  SELL: 'SELL'
};

exports.OrderType = exports.$Enums.OrderType = {
  LIMIT: 'LIMIT',
  MARKET: 'MARKET',
  STOP_LIMIT: 'STOP_LIMIT',
  STOP_MARKET: 'STOP_MARKET'
};

exports.OrderStatus = exports.$Enums.OrderStatus = {
  PENDING: 'PENDING',
  NEW: 'NEW',
  PARTIALLY_FILLED: 'PARTIALLY_FILLED',
  FILLED: 'FILLED',
  CANCELED: 'CANCELED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  UNKNOWN: 'UNKNOWN'
};

exports.BacktestStatus = exports.$Enums.BacktestStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

exports.LogLevel = exports.$Enums.LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

exports.Prisma.ModelName = {
  User: 'User',
  ExchangeAccount: 'ExchangeAccount',
  Bot: 'Bot',
  GridLevel: 'GridLevel',
  Order: 'Order',
  Fill: 'Fill',
  Market: 'Market',
  Candle: 'Candle',
  BalanceSnapshot: 'BalanceSnapshot',
  PnLSnapshot: 'PnLSnapshot',
  Backtest: 'Backtest',
  BacktestTrade: 'BacktestTrade',
  SystemSetting: 'SystemSetting',
  EventLog: 'EventLog',
  AuditLog: 'AuditLog',
  RiskSetting: 'RiskSetting'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
