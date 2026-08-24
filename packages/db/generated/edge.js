
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  NotFoundError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime
} = require('./runtime/edge.js')


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

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.NotFoundError = NotFoundError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

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
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "/workspace/packages/db/generated",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "debian-openssl-3.0.x",
        "native": true
      }
    ],
    "previewFeatures": [],
    "sourceFilePath": "/workspace/packages/db/prisma/schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null
  },
  "relativePath": "../prisma",
  "clientVersion": "5.22.0",
  "engineVersion": "605197351a3c8bdd595af2d2a9bc3025bca48ea2",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "postinstall": false,
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": null
      }
    }
  },
  "inlineSchema": "// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\ngenerator client {\n  provider      = \"prisma-client-js\"\n  output        = \"../generated\"\n  binaryTargets = [\"native\"]\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\n// ============================================================================\n// User & Authentication\n// ============================================================================\n\nmodel User {\n  id               String            @id @default(uuid())\n  email            String            @unique\n  passwordHash     String\n  role             UserRole          @default(ADMIN)\n  createdAt        DateTime          @default(now())\n  updatedAt        DateTime          @updatedAt\n  exchangeAccounts ExchangeAccount[]\n  bots             Bot[]\n  auditLogs        AuditLog[]\n\n  @@index([email])\n}\n\nenum UserRole {\n  ADMIN\n  TRADER\n  VIEWER\n}\n\n// ============================================================================\n// Exchange Account (Encrypted API Keys)\n// ============================================================================\n\nmodel ExchangeAccount {\n  id                 String            @id @default(uuid())\n  userId             String\n  user               User              @relation(fields: [userId], references: [id], onDelete: Cascade)\n  name               String\n  apiKeyEncrypted    String\n  apiIv              String\n  apiAuthTag         String\n  subAccountClientId String?\n  isLiveEnabled      Boolean           @default(false)\n  isActive           Boolean           @default(true)\n  createdAt          DateTime          @default(now())\n  updatedAt          DateTime          @updatedAt\n  bots               Bot[]\n  balanceSnapshots   BalanceSnapshot[]\n\n  @@index([userId])\n  @@index([isActive])\n}\n\n// ============================================================================\n// Bot Configuration\n// ============================================================================\n\nmodel Bot {\n  id                String           @id @default(uuid())\n  userId            String\n  user              User             @relation(fields: [userId], references: [id], onDelete: Cascade)\n  exchangeAccountId String?\n  exchangeAccount   ExchangeAccount? @relation(fields: [exchangeAccountId], references: [id], onDelete: SetNull)\n  name              String\n  symbol            String\n  strategyType      StrategyType     @default(GRID)\n  mode              TradingMode      @default(DRY_RUN)\n  status            BotStatus        @default(DRAFT)\n\n  // Grid configuration stored as JSON for flexibility\n  gridConfig   Json\n  runtimeState Json?\n\n  // Risk limits\n  maxQuoteExposure      Decimal? @db.Decimal(32, 16)\n  maxBaseExposure       Decimal? @db.Decimal(32, 16)\n  dailyLossLimitPercent Decimal? @db.Decimal(5, 4)\n\n  // PnL tracking\n  realizedPnL   Decimal @default(0) @db.Decimal(32, 16)\n  unrealizedPnL Decimal @default(0) @db.Decimal(32, 16)\n  totalFeesPaid Decimal @default(0) @db.Decimal(32, 16)\n\n  // Statistics\n  totalBuys       Int @default(0)\n  totalSells      Int @default(0)\n  totalGridCycles Int @default(0)\n\n  createdAt DateTime  @default(now())\n  updatedAt DateTime  @updatedAt\n  startedAt DateTime?\n  stoppedAt DateTime?\n\n  orders       Order[]\n  fills        Fill[]\n  gridLevels   GridLevel[]\n  pnlSnapshots PnLSnapshot[]\n  eventLogs    EventLog[]\n\n  @@index([userId])\n  @@index([symbol])\n  @@index([status])\n  @@index([mode])\n}\n\nenum StrategyType {\n  GRID\n}\n\nenum TradingMode {\n  DRY_RUN\n  LIVE\n}\n\nenum BotStatus {\n  DRAFT\n  STARTING\n  RUNNING\n  PAUSING\n  PAUSED\n  STOPPING\n  STOPPED\n  ERROR\n  RANGE_EXITED\n  KILLED\n}\n\n// ============================================================================\n// Grid Levels\n// ============================================================================\n\nmodel GridLevel {\n  id             String          @id @default(uuid())\n  botId          String\n  bot            Bot             @relation(fields: [botId], references: [id], onDelete: Cascade)\n  levelIndex     Int\n  price          Decimal         @db.Decimal(32, 16)\n  status         GridLevelStatus @default(IDLE)\n  buyOrderId     String?\n  sellOrderId    String?\n  filledQuantity Decimal         @default(0) @db.Decimal(32, 16)\n  averageCost    Decimal?        @db.Decimal(32, 16)\n  createdAt      DateTime        @default(now())\n  updatedAt      DateTime        @updatedAt\n\n  @@unique([botId, levelIndex])\n  @@index([botId])\n  @@index([status])\n}\n\nenum GridLevelStatus {\n  IDLE\n  BUY_ORDER_OPEN\n  BUY_PARTIALLY_FILLED\n  BUY_FILLED\n  SELL_ORDER_OPEN\n  SELL_PARTIALLY_FILLED\n  SELL_FILLED\n  ERROR\n}\n\n// ============================================================================\n// Orders\n// ============================================================================\n\nmodel Order {\n  id              String      @id @default(uuid())\n  botId           String\n  bot             Bot         @relation(fields: [botId], references: [id], onDelete: Cascade)\n  clientOrderId   String      @unique\n  exchangeOrderId String?\n  symbol          String\n  side            OrderSide\n  type            OrderType\n  status          OrderStatus @default(PENDING)\n  price           Decimal     @db.Decimal(32, 16)\n  quantity        Decimal     @db.Decimal(32, 16)\n  executedQty     Decimal     @default(0) @db.Decimal(32, 16)\n  executedSum     Decimal     @default(0) @db.Decimal(32, 16)\n  fee             Decimal     @default(0) @db.Decimal(32, 16)\n  feeAsset        String?\n  isDryRun        Boolean     @default(true)\n  metadata        Json?\n  createdAt       DateTime    @default(now())\n  updatedAt       DateTime    @updatedAt\n  executedAt      DateTime?\n\n  fills Fill[]\n\n  @@index([botId])\n  @@index([clientOrderId])\n  @@index([symbol])\n  @@index([status])\n  @@index([side])\n}\n\nenum OrderSide {\n  BUY\n  SELL\n}\n\nenum OrderType {\n  LIMIT\n  MARKET\n  STOP_LIMIT\n  STOP_MARKET\n}\n\nenum OrderStatus {\n  PENDING\n  NEW\n  PARTIALLY_FILLED\n  FILLED\n  CANCELED\n  REJECTED\n  EXPIRED\n  UNKNOWN\n}\n\n// ============================================================================\n// Fills\n// ============================================================================\n\nmodel Fill {\n  id        String   @id @default(uuid())\n  botId     String\n  bot       Bot      @relation(fields: [botId], references: [id], onDelete: Cascade)\n  orderId   String\n  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)\n  fillId    String? // Exchange fill ID\n  price     Decimal  @db.Decimal(32, 16)\n  quantity  Decimal  @db.Decimal(32, 16)\n  sum       Decimal  @db.Decimal(32, 16)\n  fee       Decimal  @default(0) @db.Decimal(32, 16)\n  feeAsset  String?\n  isBuyer   Boolean\n  isMaker   Boolean?\n  isDryRun  Boolean  @default(true)\n  timestamp DateTime @default(now())\n\n  @@index([botId])\n  @@index([orderId])\n  @@index([timestamp])\n}\n\n// ============================================================================\n// Market Data\n// ============================================================================\n\nmodel Market {\n  id              String   @id @default(uuid())\n  symbol          String   @unique\n  baseAsset       String\n  quoteAsset      String\n  isSpot          Boolean  @default(true)\n  isTmnBased      Boolean  @default(false)\n  isUsdtBased     Boolean  @default(false)\n  amountPrecision Int      @default(8)\n  pricePrecision  Int      @default(8)\n  minNotional     Decimal? @db.Decimal(32, 16)\n  isActive        Boolean  @default(true)\n  lastPrice       Decimal? @db.Decimal(32, 16)\n  volume24h       Decimal? @db.Decimal(32, 16)\n  updatedAt       DateTime @updatedAt\n\n  candles Candle[]\n\n  @@index([symbol])\n  @@index([isSpot])\n  @@index([isActive])\n}\n\nmodel Candle {\n  id         String   @id @default(uuid())\n  marketId   String\n  market     Market   @relation(fields: [marketId], references: [id], onDelete: Cascade)\n  timestamp  DateTime\n  resolution String\n  open       Decimal  @db.Decimal(32, 16)\n  high       Decimal  @db.Decimal(32, 16)\n  low        Decimal  @db.Decimal(32, 16)\n  close      Decimal  @db.Decimal(32, 16)\n  volume     Decimal  @db.Decimal(32, 16)\n\n  @@unique([marketId, timestamp, resolution])\n  @@index([marketId, resolution, timestamp])\n}\n\n// ============================================================================\n// Balance Snapshots\n// ============================================================================\n\nmodel BalanceSnapshot {\n  id                String           @id @default(uuid())\n  exchangeAccountId String?\n  exchangeAccount   ExchangeAccount? @relation(fields: [exchangeAccountId], references: [id], onDelete: Cascade)\n  botId             String?\n  asset             String\n  total             Decimal          @db.Decimal(32, 16)\n  available         Decimal          @db.Decimal(32, 16)\n  locked            Decimal          @db.Decimal(32, 16)\n  isDryRun          Boolean          @default(true)\n  timestamp         DateTime         @default(now())\n\n  @@index([exchangeAccountId])\n  @@index([botId])\n  @@index([asset])\n  @@index([timestamp])\n}\n\n// ============================================================================\n// PnL Snapshots\n// ============================================================================\n\nmodel PnLSnapshot {\n  id            String   @id @default(uuid())\n  botId         String\n  bot           Bot      @relation(fields: [botId], references: [id], onDelete: Cascade)\n  realizedPnL   Decimal  @db.Decimal(32, 16)\n  unrealizedPnL Decimal  @db.Decimal(32, 16)\n  totalPnL      Decimal  @db.Decimal(32, 16)\n  feesPaid      Decimal  @db.Decimal(32, 16)\n  baseBalance   Decimal  @db.Decimal(32, 16)\n  quoteBalance  Decimal  @db.Decimal(32, 16)\n  timestamp     DateTime @default(now())\n\n  @@index([botId])\n  @@index([timestamp])\n}\n\n// ============================================================================\n// Backtesting\n// ============================================================================\n\nmodel Backtest {\n  id          String         @id @default(uuid())\n  userId      String\n  name        String\n  symbol      String\n  dateFrom    DateTime\n  dateTo      DateTime\n  resolution  String\n  config      Json\n  results     Json?\n  status      BacktestStatus @default(PENDING)\n  createdAt   DateTime       @default(now())\n  completedAt DateTime?\n\n  trades BacktestTrade[]\n\n  @@index([userId])\n  @@index([symbol])\n  @@index([status])\n}\n\nenum BacktestStatus {\n  PENDING\n  RUNNING\n  COMPLETED\n  FAILED\n}\n\nmodel BacktestTrade {\n  id         String    @id @default(uuid())\n  backtestId String\n  backtest   Backtest  @relation(fields: [backtestId], references: [id], onDelete: Cascade)\n  timestamp  DateTime\n  side       OrderSide\n  price      Decimal   @db.Decimal(32, 16)\n  quantity   Decimal   @db.Decimal(32, 16)\n  fee        Decimal   @db.Decimal(32, 16)\n  pnl        Decimal   @db.Decimal(32, 16)\n\n  @@index([backtestId])\n  @@index([timestamp])\n}\n\n// ============================================================================\n// System Settings & Logs\n// ============================================================================\n\nmodel SystemSetting {\n  key       String   @id\n  value     Json\n  updatedAt DateTime @updatedAt\n}\n\nmodel EventLog {\n  id        String   @id @default(uuid())\n  botId     String?\n  bot       Bot?     @relation(fields: [botId], references: [id], onDelete: Cascade)\n  level     LogLevel @default(INFO)\n  event     String\n  message   String\n  data      Json?\n  createdAt DateTime @default(now())\n\n  @@index([botId])\n  @@index([level])\n  @@index([event])\n  @@index([createdAt])\n}\n\nenum LogLevel {\n  DEBUG\n  INFO\n  WARN\n  ERROR\n}\n\nmodel AuditLog {\n  id         String   @id @default(uuid())\n  userId     String\n  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n  action     String\n  resource   String?\n  resourceId String?\n  ipAddress  String?\n  userAgent  String?\n  data       Json?\n  createdAt  DateTime @default(now())\n\n  @@index([userId])\n  @@index([action])\n  @@index([createdAt])\n}\n\n// ============================================================================\n// Risk Settings (Global)\n// ============================================================================\n\nmodel RiskSetting {\n  id                     String   @id @default(uuid())\n  key                    String   @unique\n  maxBotsGlobal          Int      @default(10)\n  maxBotsPerSymbol       Int      @default(3)\n  maxDailyLossPercent    Decimal  @default(5) @db.Decimal(5, 4)\n  maxQuoteExposureGlobal Decimal  @default(100000) @db.Decimal(32, 16)\n  killSwitchActive       Boolean  @default(false)\n  allowLiveTrading       Boolean  @default(false)\n  updatedAt              DateTime @updatedAt\n}\n",
  "inlineSchemaHash": "76fc95f6f9e0e52e6393bb71f93a7cde890fe41190f27224da1b3fddd23b2ee0",
  "copyEngine": true
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"email\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"passwordHash\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"role\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"UserRole\",\"default\":\"ADMIN\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"exchangeAccounts\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ExchangeAccount\",\"relationName\":\"ExchangeAccountToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"bots\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bot\",\"relationName\":\"BotToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"auditLogs\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AuditLog\",\"relationName\":\"AuditLogToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"ExchangeAccount\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"relationName\":\"ExchangeAccountToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"apiKeyEncrypted\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"apiIv\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"apiAuthTag\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"subAccountClientId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isLiveEnabled\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isActive\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":true,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"bots\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bot\",\"relationName\":\"BotToExchangeAccount\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"balanceSnapshots\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"BalanceSnapshot\",\"relationName\":\"BalanceSnapshotToExchangeAccount\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Bot\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"relationName\":\"BotToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"exchangeAccountId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"exchangeAccount\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ExchangeAccount\",\"relationName\":\"BotToExchangeAccount\",\"relationFromFields\":[\"exchangeAccountId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"SetNull\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"symbol\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"strategyType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"StrategyType\",\"default\":\"GRID\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"mode\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"TradingMode\",\"default\":\"DRY_RUN\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BotStatus\",\"default\":\"DRAFT\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"gridConfig\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"runtimeState\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"maxQuoteExposure\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"maxBaseExposure\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"dailyLossLimitPercent\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"realizedPnL\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Decimal\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"unrealizedPnL\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Decimal\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalFeesPaid\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Decimal\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalBuys\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalSells\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalGridCycles\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"startedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"stoppedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"orders\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Order\",\"relationName\":\"BotToOrder\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fills\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Fill\",\"relationName\":\"BotToFill\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"gridLevels\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"GridLevel\",\"relationName\":\"BotToGridLevel\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"pnlSnapshots\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PnLSnapshot\",\"relationName\":\"BotToPnLSnapshot\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"eventLogs\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"EventLog\",\"relationName\":\"BotToEventLog\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"GridLevel\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"botId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"bot\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bot\",\"relationName\":\"BotToGridLevel\",\"relationFromFields\":[\"botId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"levelIndex\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"price\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"GridLevelStatus\",\"default\":\"IDLE\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"buyOrderId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sellOrderId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"filledQuantity\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Decimal\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"averageCost\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true}],\"primaryKey\":null,\"uniqueFields\":[[\"botId\",\"levelIndex\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"botId\",\"levelIndex\"]}],\"isGenerated\":false},\"Order\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"botId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"bot\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bot\",\"relationName\":\"BotToOrder\",\"relationFromFields\":[\"botId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"clientOrderId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"exchangeOrderId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"symbol\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"side\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"OrderSide\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"OrderType\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"OrderStatus\",\"default\":\"PENDING\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"price\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"quantity\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"executedQty\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Decimal\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"executedSum\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Decimal\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fee\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Decimal\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"feeAsset\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isDryRun\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":true,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"metadata\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"executedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fills\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Fill\",\"relationName\":\"FillToOrder\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Fill\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"botId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"bot\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bot\",\"relationName\":\"BotToFill\",\"relationFromFields\":[\"botId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"orderId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"order\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Order\",\"relationName\":\"FillToOrder\",\"relationFromFields\":[\"orderId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fillId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"price\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"quantity\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sum\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fee\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Decimal\",\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"feeAsset\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isBuyer\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Boolean\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isMaker\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Boolean\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isDryRun\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":true,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"timestamp\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Market\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"symbol\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"baseAsset\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"quoteAsset\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isSpot\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":true,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isTmnBased\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isUsdtBased\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"amountPrecision\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":8,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"pricePrecision\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":8,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"minNotional\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isActive\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":true,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"lastPrice\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"volume24h\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"candles\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Candle\",\"relationName\":\"CandleToMarket\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Candle\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"marketId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"market\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Market\",\"relationName\":\"CandleToMarket\",\"relationFromFields\":[\"marketId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"timestamp\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"resolution\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"open\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"high\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"low\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"close\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"volume\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"marketId\",\"timestamp\",\"resolution\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"marketId\",\"timestamp\",\"resolution\"]}],\"isGenerated\":false},\"BalanceSnapshot\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"exchangeAccountId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"exchangeAccount\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ExchangeAccount\",\"relationName\":\"BalanceSnapshotToExchangeAccount\",\"relationFromFields\":[\"exchangeAccountId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"botId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"asset\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"total\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"available\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"locked\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isDryRun\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":true,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"timestamp\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PnLSnapshot\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"botId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"bot\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bot\",\"relationName\":\"BotToPnLSnapshot\",\"relationFromFields\":[\"botId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"realizedPnL\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"unrealizedPnL\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalPnL\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"feesPaid\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"baseBalance\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"quoteBalance\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"timestamp\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Backtest\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"symbol\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"dateFrom\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"dateTo\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"resolution\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"config\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"results\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"BacktestStatus\",\"default\":\"PENDING\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"completedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"trades\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"BacktestTrade\",\"relationName\":\"BacktestToBacktestTrade\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"BacktestTrade\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"backtestId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"backtest\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Backtest\",\"relationName\":\"BacktestToBacktestTrade\",\"relationFromFields\":[\"backtestId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"timestamp\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"side\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"OrderSide\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"price\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"quantity\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fee\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"pnl\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Decimal\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"SystemSetting\":{\"dbName\":null,\"fields\":[{\"name\":\"key\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"value\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"EventLog\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"botId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"bot\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Bot\",\"relationName\":\"BotToEventLog\",\"relationFromFields\":[\"botId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"level\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"LogLevel\",\"default\":\"INFO\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"event\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"message\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"data\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"AuditLog\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"relationName\":\"AuditLogToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"action\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"resource\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"resourceId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"ipAddress\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userAgent\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"data\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"RiskSetting\":{\"dbName\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"default\":{\"name\":\"uuid(4)\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"key\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"maxBotsGlobal\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":10,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"maxBotsPerSymbol\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"default\":3,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"maxDailyLossPercent\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Decimal\",\"default\":5,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"maxQuoteExposureGlobal\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Decimal\",\"default\":100000,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"killSwitchActive\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"allowLiveTrading\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"isGenerated\":false,\"isUpdatedAt\":true}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false}},\"enums\":{\"UserRole\":{\"values\":[{\"name\":\"ADMIN\",\"dbName\":null},{\"name\":\"TRADER\",\"dbName\":null},{\"name\":\"VIEWER\",\"dbName\":null}],\"dbName\":null},\"StrategyType\":{\"values\":[{\"name\":\"GRID\",\"dbName\":null}],\"dbName\":null},\"TradingMode\":{\"values\":[{\"name\":\"DRY_RUN\",\"dbName\":null},{\"name\":\"LIVE\",\"dbName\":null}],\"dbName\":null},\"BotStatus\":{\"values\":[{\"name\":\"DRAFT\",\"dbName\":null},{\"name\":\"STARTING\",\"dbName\":null},{\"name\":\"RUNNING\",\"dbName\":null},{\"name\":\"PAUSING\",\"dbName\":null},{\"name\":\"PAUSED\",\"dbName\":null},{\"name\":\"STOPPING\",\"dbName\":null},{\"name\":\"STOPPED\",\"dbName\":null},{\"name\":\"ERROR\",\"dbName\":null},{\"name\":\"RANGE_EXITED\",\"dbName\":null},{\"name\":\"KILLED\",\"dbName\":null}],\"dbName\":null},\"GridLevelStatus\":{\"values\":[{\"name\":\"IDLE\",\"dbName\":null},{\"name\":\"BUY_ORDER_OPEN\",\"dbName\":null},{\"name\":\"BUY_PARTIALLY_FILLED\",\"dbName\":null},{\"name\":\"BUY_FILLED\",\"dbName\":null},{\"name\":\"SELL_ORDER_OPEN\",\"dbName\":null},{\"name\":\"SELL_PARTIALLY_FILLED\",\"dbName\":null},{\"name\":\"SELL_FILLED\",\"dbName\":null},{\"name\":\"ERROR\",\"dbName\":null}],\"dbName\":null},\"OrderSide\":{\"values\":[{\"name\":\"BUY\",\"dbName\":null},{\"name\":\"SELL\",\"dbName\":null}],\"dbName\":null},\"OrderType\":{\"values\":[{\"name\":\"LIMIT\",\"dbName\":null},{\"name\":\"MARKET\",\"dbName\":null},{\"name\":\"STOP_LIMIT\",\"dbName\":null},{\"name\":\"STOP_MARKET\",\"dbName\":null}],\"dbName\":null},\"OrderStatus\":{\"values\":[{\"name\":\"PENDING\",\"dbName\":null},{\"name\":\"NEW\",\"dbName\":null},{\"name\":\"PARTIALLY_FILLED\",\"dbName\":null},{\"name\":\"FILLED\",\"dbName\":null},{\"name\":\"CANCELED\",\"dbName\":null},{\"name\":\"REJECTED\",\"dbName\":null},{\"name\":\"EXPIRED\",\"dbName\":null},{\"name\":\"UNKNOWN\",\"dbName\":null}],\"dbName\":null},\"BacktestStatus\":{\"values\":[{\"name\":\"PENDING\",\"dbName\":null},{\"name\":\"RUNNING\",\"dbName\":null},{\"name\":\"COMPLETED\",\"dbName\":null},{\"name\":\"FAILED\",\"dbName\":null}],\"dbName\":null},\"LogLevel\":{\"values\":[{\"name\":\"DEBUG\",\"dbName\":null},{\"name\":\"INFO\",\"dbName\":null},{\"name\":\"WARN\",\"dbName\":null},{\"name\":\"ERROR\",\"dbName\":null}],\"dbName\":null}},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = undefined

config.injectableEdgeEnv = () => ({
  parsed: {
    DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

