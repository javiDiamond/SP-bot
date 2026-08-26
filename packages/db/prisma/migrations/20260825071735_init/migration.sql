-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TRADER', 'VIEWER');

-- CreateEnum
CREATE TYPE "StrategyType" AS ENUM ('GRID');

-- CreateEnum
CREATE TYPE "TradingMode" AS ENUM ('DRY_RUN', 'LIVE');

-- CreateEnum
CREATE TYPE "BotStatus" AS ENUM ('DRAFT', 'STARTING', 'RUNNING', 'PAUSING', 'PAUSED', 'STOPPING', 'STOPPED', 'ERROR', 'RANGE_EXITED', 'KILLED');

-- CreateEnum
CREATE TYPE "GridLevelStatus" AS ENUM ('IDLE', 'BUY_ORDER_OPEN', 'BUY_PARTIALLY_FILLED', 'BUY_FILLED', 'SELL_ORDER_OPEN', 'SELL_PARTIALLY_FILLED', 'SELL_FILLED', 'ERROR');

-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('LIMIT', 'MARKET', 'STOP_LIMIT', 'STOP_MARKET');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'NEW', 'PARTIALLY_FILLED', 'FILLED', 'CANCELED', 'REJECTED', 'EXPIRED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "BacktestStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "OptimizationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKeyEncrypted" TEXT NOT NULL,
    "apiIv" TEXT NOT NULL,
    "apiAuthTag" TEXT NOT NULL,
    "subAccountClientId" TEXT,
    "isLiveEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exchangeAccountId" TEXT,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "strategyType" "StrategyType" NOT NULL DEFAULT 'GRID',
    "mode" "TradingMode" NOT NULL DEFAULT 'DRY_RUN',
    "status" "BotStatus" NOT NULL DEFAULT 'DRAFT',
    "gridConfig" JSONB NOT NULL,
    "runtimeState" JSONB,
    "maxQuoteExposure" DECIMAL(32,16),
    "maxBaseExposure" DECIMAL(32,16),
    "dailyLossLimitPercent" DECIMAL(5,4),
    "realizedPnL" DECIMAL(32,16) NOT NULL DEFAULT 0,
    "unrealizedPnL" DECIMAL(32,16) NOT NULL DEFAULT 0,
    "totalFeesPaid" DECIMAL(32,16) NOT NULL DEFAULT 0,
    "totalBuys" INTEGER NOT NULL DEFAULT 0,
    "totalSells" INTEGER NOT NULL DEFAULT 0,
    "totalGridCycles" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),

    CONSTRAINT "Bot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GridLevel" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "levelIndex" INTEGER NOT NULL,
    "price" DECIMAL(32,16) NOT NULL,
    "status" "GridLevelStatus" NOT NULL DEFAULT 'IDLE',
    "buyOrderId" TEXT,
    "sellOrderId" TEXT,
    "filledQuantity" DECIMAL(32,16) NOT NULL DEFAULT 0,
    "averageCost" DECIMAL(32,16),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GridLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "clientOrderId" TEXT NOT NULL,
    "exchangeOrderId" TEXT,
    "symbol" TEXT NOT NULL,
    "side" "OrderSide" NOT NULL,
    "type" "OrderType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "price" DECIMAL(32,16) NOT NULL,
    "quantity" DECIMAL(32,16) NOT NULL,
    "executedQty" DECIMAL(32,16) NOT NULL DEFAULT 0,
    "executedSum" DECIMAL(32,16) NOT NULL DEFAULT 0,
    "fee" DECIMAL(32,16) NOT NULL DEFAULT 0,
    "feeAsset" TEXT,
    "isDryRun" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fill" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fillId" TEXT,
    "price" DECIMAL(32,16) NOT NULL,
    "quantity" DECIMAL(32,16) NOT NULL,
    "sum" DECIMAL(32,16) NOT NULL,
    "fee" DECIMAL(32,16) NOT NULL DEFAULT 0,
    "feeAsset" TEXT,
    "isBuyer" BOOLEAN NOT NULL,
    "isMaker" BOOLEAN,
    "isDryRun" BOOLEAN NOT NULL DEFAULT true,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "isSpot" BOOLEAN NOT NULL DEFAULT true,
    "isTmnBased" BOOLEAN NOT NULL DEFAULT false,
    "isUsdtBased" BOOLEAN NOT NULL DEFAULT false,
    "amountPrecision" INTEGER NOT NULL DEFAULT 8,
    "pricePrecision" INTEGER NOT NULL DEFAULT 8,
    "minNotional" DECIMAL(32,16),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastPrice" DECIMAL(32,16),
    "volume24h" DECIMAL(32,16),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candle" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "resolution" TEXT NOT NULL,
    "open" DECIMAL(32,16) NOT NULL,
    "high" DECIMAL(32,16) NOT NULL,
    "low" DECIMAL(32,16) NOT NULL,
    "close" DECIMAL(32,16) NOT NULL,
    "volume" DECIMAL(32,16) NOT NULL,

    CONSTRAINT "Candle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BalanceSnapshot" (
    "id" TEXT NOT NULL,
    "exchangeAccountId" TEXT,
    "botId" TEXT,
    "asset" TEXT NOT NULL,
    "total" DECIMAL(32,16) NOT NULL,
    "available" DECIMAL(32,16) NOT NULL,
    "locked" DECIMAL(32,16) NOT NULL,
    "isDryRun" BOOLEAN NOT NULL DEFAULT true,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PnLSnapshot" (
    "id" TEXT NOT NULL,
    "botId" TEXT NOT NULL,
    "realizedPnL" DECIMAL(32,16) NOT NULL,
    "unrealizedPnL" DECIMAL(32,16) NOT NULL,
    "totalPnL" DECIMAL(32,16) NOT NULL,
    "feesPaid" DECIMAL(32,16) NOT NULL,
    "baseBalance" DECIMAL(32,16) NOT NULL,
    "quoteBalance" DECIMAL(32,16) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PnLSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backtest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "resolution" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "results" JSONB,
    "status" "BacktestStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "optimizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Backtest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacktestTrade" (
    "id" TEXT NOT NULL,
    "backtestId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "side" "OrderSide" NOT NULL,
    "price" DECIMAL(32,16) NOT NULL,
    "quantity" DECIMAL(32,16) NOT NULL,
    "fee" DECIMAL(32,16) NOT NULL,
    "pnl" DECIMAL(32,16) NOT NULL,

    CONSTRAINT "BacktestTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "resolution" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "status" "OptimizationStatus" NOT NULL DEFAULT 'PENDING',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxCombos" INTEGER NOT NULL DEFAULT 50,
    "bestResult" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OptimizationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "botId" TEXT,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "event" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "maxBotsGlobal" INTEGER NOT NULL DEFAULT 10,
    "maxBotsPerSymbol" INTEGER NOT NULL DEFAULT 3,
    "maxDailyLossPercent" DECIMAL(5,4) NOT NULL DEFAULT 5,
    "maxQuoteExposureGlobal" DECIMAL(32,16) NOT NULL DEFAULT 100000,
    "killSwitchActive" BOOLEAN NOT NULL DEFAULT false,
    "allowLiveTrading" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "ExchangeAccount_userId_idx" ON "ExchangeAccount"("userId");

-- CreateIndex
CREATE INDEX "ExchangeAccount_isActive_idx" ON "ExchangeAccount"("isActive");

-- CreateIndex
CREATE INDEX "Bot_userId_idx" ON "Bot"("userId");

-- CreateIndex
CREATE INDEX "Bot_symbol_idx" ON "Bot"("symbol");

-- CreateIndex
CREATE INDEX "Bot_status_idx" ON "Bot"("status");

-- CreateIndex
CREATE INDEX "Bot_mode_idx" ON "Bot"("mode");

-- CreateIndex
CREATE INDEX "GridLevel_botId_idx" ON "GridLevel"("botId");

-- CreateIndex
CREATE INDEX "GridLevel_status_idx" ON "GridLevel"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GridLevel_botId_levelIndex_key" ON "GridLevel"("botId", "levelIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Order_clientOrderId_key" ON "Order"("clientOrderId");

-- CreateIndex
CREATE INDEX "Order_botId_idx" ON "Order"("botId");

-- CreateIndex
CREATE INDEX "Order_clientOrderId_idx" ON "Order"("clientOrderId");

-- CreateIndex
CREATE INDEX "Order_symbol_idx" ON "Order"("symbol");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_side_idx" ON "Order"("side");

-- CreateIndex
CREATE INDEX "Fill_botId_idx" ON "Fill"("botId");

-- CreateIndex
CREATE INDEX "Fill_orderId_idx" ON "Fill"("orderId");

-- CreateIndex
CREATE INDEX "Fill_timestamp_idx" ON "Fill"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Market_symbol_key" ON "Market"("symbol");

-- CreateIndex
CREATE INDEX "Market_symbol_idx" ON "Market"("symbol");

-- CreateIndex
CREATE INDEX "Market_isSpot_idx" ON "Market"("isSpot");

-- CreateIndex
CREATE INDEX "Market_isActive_idx" ON "Market"("isActive");

-- CreateIndex
CREATE INDEX "Candle_marketId_resolution_timestamp_idx" ON "Candle"("marketId", "resolution", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Candle_marketId_timestamp_resolution_key" ON "Candle"("marketId", "timestamp", "resolution");

-- CreateIndex
CREATE INDEX "BalanceSnapshot_exchangeAccountId_idx" ON "BalanceSnapshot"("exchangeAccountId");

-- CreateIndex
CREATE INDEX "BalanceSnapshot_botId_idx" ON "BalanceSnapshot"("botId");

-- CreateIndex
CREATE INDEX "BalanceSnapshot_asset_idx" ON "BalanceSnapshot"("asset");

-- CreateIndex
CREATE INDEX "BalanceSnapshot_timestamp_idx" ON "BalanceSnapshot"("timestamp");

-- CreateIndex
CREATE INDEX "PnLSnapshot_botId_idx" ON "PnLSnapshot"("botId");

-- CreateIndex
CREATE INDEX "PnLSnapshot_timestamp_idx" ON "PnLSnapshot"("timestamp");

-- CreateIndex
CREATE INDEX "Backtest_userId_idx" ON "Backtest"("userId");

-- CreateIndex
CREATE INDEX "Backtest_symbol_idx" ON "Backtest"("symbol");

-- CreateIndex
CREATE INDEX "Backtest_status_idx" ON "Backtest"("status");

-- CreateIndex
CREATE INDEX "BacktestTrade_backtestId_idx" ON "BacktestTrade"("backtestId");

-- CreateIndex
CREATE INDEX "BacktestTrade_timestamp_idx" ON "BacktestTrade"("timestamp");

-- CreateIndex
CREATE INDEX "OptimizationJob_userId_idx" ON "OptimizationJob"("userId");

-- CreateIndex
CREATE INDEX "OptimizationJob_status_idx" ON "OptimizationJob"("status");

-- CreateIndex
CREATE INDEX "EventLog_botId_idx" ON "EventLog"("botId");

-- CreateIndex
CREATE INDEX "EventLog_level_idx" ON "EventLog"("level");

-- CreateIndex
CREATE INDEX "EventLog_event_idx" ON "EventLog"("event");

-- CreateIndex
CREATE INDEX "EventLog_createdAt_idx" ON "EventLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RiskSetting_key_key" ON "RiskSetting"("key");

-- AddForeignKey
ALTER TABLE "ExchangeAccount" ADD CONSTRAINT "ExchangeAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_exchangeAccountId_fkey" FOREIGN KEY ("exchangeAccountId") REFERENCES "ExchangeAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GridLevel" ADD CONSTRAINT "GridLevel_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fill" ADD CONSTRAINT "Fill_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fill" ADD CONSTRAINT "Fill_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candle" ADD CONSTRAINT "Candle_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceSnapshot" ADD CONSTRAINT "BalanceSnapshot_exchangeAccountId_fkey" FOREIGN KEY ("exchangeAccountId") REFERENCES "ExchangeAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PnLSnapshot" ADD CONSTRAINT "PnLSnapshot_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backtest" ADD CONSTRAINT "Backtest_optimizationId_fkey" FOREIGN KEY ("optimizationId") REFERENCES "OptimizationJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BacktestTrade" ADD CONSTRAINT "BacktestTrade_backtestId_fkey" FOREIGN KEY ("backtestId") REFERENCES "Backtest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
