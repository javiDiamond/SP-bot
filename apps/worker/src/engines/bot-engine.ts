/**
 * Bot Engine Driver
 *
 * Thin worker-side driver around the shared GridEngine (spec §23):
 * - Owns the WallexExchange adapter (LIVE or DRY_RUN/paper)
 * - Pumps market data (WS + REST fallback) into paper fills + the engine
 * - Persists levels/orders/fills/stats/PnL/balances to the DB via hooks
 * - Applies the pre-trade risk gate (kill switch, exposure, stale price...)
 * - Holds a Redis lock for the engine lifetime (value-checked release)
 * - Reconciliation against exchange open orders
 *
 * The engine itself stays DB-free and exchange-free (ports only).
 */

import {
  prisma,
  BotStatus,
  OrderStatus as DbOrderStatus,
  TradingMode as DbTradingMode,
} from '@wallex/db';
import type { Bot, ExchangeAccount, Order } from '@wallex/db';
import {
  Balance,
  BotStatus as SharedBotStatus,
  GridConfigSchema,
  GridConfig,
  MarketInfo,
  OrderSide,
  OrderStatus,
  OrderType,
  PlaceOrderRequest,
  PlacedOrder,
  TradingMode,
  decryptApiKey,
  logger,
} from '@wallex/shared';
import { GridEngine, GridFillEvent, GridLevelState, GridMetrics, LifecycleAction } from '@wallex/grid-strategy';
import { ExchangeMode, WallexExchange } from '@wallex/exchange';
import type { MarketData } from '@wallex/exchange';
import Decimal from 'decimal.js';
import { workerConfig } from '../config';
import { RiskService } from '../services/risk';
import { RealtimePublisher } from '../services/events';
import { RedisLock } from '../utils/redis-lock';
import { writeEventLog } from '../utils/event-log';
import { diffOpenOrders } from '../services/reconcile-diff';

export interface BotEngineDeps {
  risk: RiskService;
  events: RealtimePublisher;
  lock: RedisLock;
}

interface KnownOrder {
  side: OrderSide;
  price: string;
  quantity: string;
}

const OPEN_DB_STATUSES: DbOrderStatus[] = [
  DbOrderStatus.PENDING,
  DbOrderStatus.NEW,
  DbOrderStatus.PARTIALLY_FILLED,
];

export class BotEngine {
  private grid?: GridEngine;
  private exchange?: WallexExchange;
  private market?: MarketInfo;
  private bot?: Bot;
  private account?: ExchangeAccount | null;
  private gridConfig?: GridConfig;

  private lockKey: string;
  private lockValue?: string;
  private lockTimer?: NodeJS.Timeout;

  private dbQueue: Promise<unknown> = Promise.resolve();
  private knownOrders = new Map<string, KnownOrder>();
  private marketDataHandler?: (md: MarketData) => void;
  private orderUpdateHandler?: (payload: unknown) => void;

  private lastStatsFlush = 0;
  private lastCycles = 0;
  private staleLogged = false;
  private shuttingDown = false;

  constructor(
    readonly botId: string,
    private deps: BotEngineDeps,
  ) {
    this.lockKey = `wallex:bot-lock:${botId}`;
  }

  get symbol(): string | undefined {
    return this.bot?.symbol;
  }

  isRunningEngine(): boolean {
    return !!this.grid && !this.shuttingDown;
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  /**
   * Start the bot engine from scratch (START / crash-recovery resume).
   */
  async start(): Promise<void> {
    if (this.isRunningEngine()) {
      logger.warn(`Bot ${this.botId}: engine already running`);
      return;
    }

    const bot = await prisma.bot.findUnique({
      where: { id: this.botId },
      include: { exchangeAccount: true },
    });
    if (!bot) {
      logger.warn(`Bot ${this.botId} not found`);
      return;
    }

    // Kill switch blocks startup outright
    if (await this.deps.risk.isKillSwitchActive()) {
      await this.setStatus(BotStatus.KILLED, 'kill-switch-active');
      return;
    }

    // Live mode gate before anything else
    if (bot.mode === DbTradingMode.LIVE) {
      await this.deps.risk.refresh();
      if (!workerConfig.enableLiveTrading) {
        await this.fail('Live trading disabled (ENABLE_LIVE_TRADING=false)');
        return;
      }
      if (!this.deps.risk.liveTradingAllowed()) {
        await this.fail('Live trading disabled in risk settings');
        return;
      }
      if (!bot.exchangeAccount?.isLiveEnabled) {
        await this.fail('Exchange account is not live-enabled');
        return;
      }
    }

    // Lock for the engine lifetime
    this.lockValue = (await this.deps.lock.acquire(this.lockKey, workerConfig.botLockTtlMs)) ?? undefined;
    if (!this.lockValue) {
      logger.warn(`Bot ${this.botId}: could not acquire lock (another worker owns it)`);
      return;
    }

    try {
      this.bot = bot;
      this.account = bot.exchangeAccount;
      this.gridConfig = GridConfigSchema.parse(bot.gridConfig);
      this.lastCycles = 0;

      this.exchange = this.buildExchange();
      if (bot.mode === DbTradingMode.DRY_RUN) {
        await this.rehydrateDryRunBalances();
      }
      this.market = await this.resolveMarket();

      await this.cleanRestartsOpenOrders();

      this.grid = this.buildGridEngine();
      this.wireLifecycleEvents(this.grid);
      this.wireExchangeEvents();
      await this.subscribeMarketData();
      await this.primeInitialPrice();

      await this.grid.start();

      await this.setStatus(BotStatus.RUNNING);
      await prisma.bot
        .update({ where: { id: this.botId }, data: { startedAt: new Date() } })
        .catch(() => undefined);
      void writeEventLog({
        botId: this.botId,
        level: 'INFO',
        event: 'bot.started',
        message: `Bot engine started (${this.exchange?.mode})`,
      });

      this.startLockRenewal();

      // Post-start reconciliation (live orders placed while we were down)
      if (this.exchange.mode === TradingMode.LIVE) {
        await this.reconcile().catch(err =>
          logger.warn(`Bot ${this.botId}: post-start reconcile failed: ${String(err?.message || err)}`),
        );
      }
    } catch (err) {
      const message = String((err as Error)?.message || err);
      logger.error(`Bot ${this.botId}: start failed: ${message}`);
      await this.teardown();
      await this.fail(message);
      throw err;
    }
  }

  async pause(): Promise<void> {
    if (!this.grid) {
      logger.warn(`Bot ${this.botId}: no running engine to pause`);
      await this.setStatus(BotStatus.PAUSED);
      return;
    }
    this.grid.pause();
    await this.flushStats(true);
    await this.setStatus(BotStatus.PAUSED);
    void writeEventLog({ botId: this.botId, level: 'INFO', event: 'bot.paused', message: 'Bot paused by command' });
  }

  async resume(): Promise<void> {
    if (this.grid && this.market) {
      await this.grid.refreshBalances();
      this.grid.resume();
      await this.grid.placeInitialOrders();
      await this.setStatus(BotStatus.RUNNING);
      void writeEventLog({
        botId: this.botId,
        level: 'INFO',
        event: 'bot.resumed',
        message: 'Bot resumed by command',
      });
      return;
    }
    // No live engine (e.g. worker restart while paused) — cold start
    await this.start();
  }

  async stop(finalStatus: BotStatus = BotStatus.STOPPED, reason = 'stopped by command'): Promise<void> {
    if (this.grid) {
      this.grid.stop();
      await this.grid.cancelAllGridOrders('stop');
    }
    await this.flushStats(true);
    await this.persistBalances();
    await this.snapshotPnl();
    await this.markOpenOrdersCanceled();
    await this.teardown();
    await prisma.bot
      .update({ where: { id: this.botId }, data: { stoppedAt: new Date() } })
      .catch(() => undefined);
    await this.setStatus(finalStatus, reason);
    void writeEventLog({ botId: this.botId, level: 'INFO', event: 'bot.stopped', message: reason });
  }

  /** Cancel all grid orders but keep the engine running. */
  async cancelAllOrders(): Promise<void> {
    if (!this.grid) {
      logger.warn(`Bot ${this.botId}: no running engine for cancel-all`);
      return;
    }
    const { canceled } = await this.grid.cancelAllGridOrders('manual-cancel');
    await prisma.order.updateMany({
      where: { botId: this.botId, clientOrderId: { in: canceled }, status: { in: OPEN_DB_STATUSES } },
      data: { status: DbOrderStatus.CANCELED },
    });
    void writeEventLog({
      botId: this.botId,
      level: 'WARN',
      event: 'bot.cancel_all',
      message: `Canceled ${canceled.length} open orders by command`,
    });
  }

  async kill(): Promise<void> {
    void writeEventLog({
      botId: this.botId,
      level: 'ERROR',
      event: 'bot.killed',
      message: 'Kill switch: canceling all orders and stopping bot',
    });
    await this.stop(BotStatus.KILLED, 'kill-switch');
  }

  // ==========================================================================
  // Construction
  // ==========================================================================

  private buildExchange(): WallexExchange {
    const bot = this.bot!;
    const config = this.gridConfig!;

    if (bot.mode === DbTradingMode.LIVE) {
      const account = this.account!;
      const apiKey = decryptApiKey(
        account.apiKeyEncrypted,
        account.apiIv,
        account.apiAuthTag,
        workerConfig.encryptionKey,
      );
      return new WallexExchange({
        mode: ExchangeMode.LIVE,
        symbol: bot.symbol,
        apiKey,
        subAccountClientId: account.subAccountClientId ?? undefined,
        wsEnabled: workerConfig.wsEnabled,
        stalePriceTimeoutMs: workerConfig.stalePriceTimeoutMs,
        pollIntervalMs: workerConfig.restPollIntervalMs,
      });
    }

    return new WallexExchange({
      mode: ExchangeMode.DRY_RUN,
      symbol: bot.symbol,
      initialBalances: this.dryRunInitialBalances(config),
      minNotional: workerConfig.minNotionalFallback,
      wsEnabled: workerConfig.wsEnabled,
      stalePriceTimeoutMs: workerConfig.stalePriceTimeoutMs,
      pollIntervalMs: workerConfig.restPollIntervalMs,
    });
  }

  private dryRunInitialBalances(config: GridConfig): Record<string, string> | undefined {
    const quote = this.quoteAssetGuess();
    if (!quote) return undefined;
    let quoteAmount: string | undefined;
    if (config.totalInvestmentQuote) {
      quoteAmount = config.totalInvestmentQuote;
    } else if (config.quotePerGrid) {
      quoteAmount = new Decimal(config.quotePerGrid).times(Math.max(config.gridCount, 1)).toString();
    }
    return { [quote]: quoteAmount || '10000' };
  }

  private quoteAssetGuess(): string | undefined {
    for (const q of ['USDT', 'TMN', 'IRT', 'BTC', 'ETH']) {
      if (this.bot!.symbol.toUpperCase().endsWith(q)) return q;
    }
    return undefined;
  }

  private async resolveMarket(): Promise<MarketInfo> {
    try {
      return await this.exchange!.getMarket(this.bot!.symbol);
    } catch (err) {
      logger.warn(
        `Bot ${this.botId}: exchange getMarket failed (${String((err as Error)?.message || err)}); falling back to DB`,
      );
    }
    const row = await prisma.market.findUnique({ where: { symbol: this.bot!.symbol } });
    if (row) {
      return {
        symbol: row.symbol,
        baseAsset: row.baseAsset,
        quoteAsset: row.quoteAsset,
        isSpot: row.isSpot,
        pricePrecision: row.pricePrecision,
        amountPrecision: row.amountPrecision,
        minNotional: row.minNotional?.toString(),
        lastPrice: row.lastPrice?.toString(),
        volume24h: row.volume24h?.toString(),
      };
    }
    throw new Error(`Market ${this.bot!.symbol} unavailable on exchange and not cached in DB`);
  }

  /**
   * DRY_RUN: reload paper balances from the latest BalanceSnapshot rows of a
   * previous run so dry-run equity survives worker restarts.
   */
  private async rehydrateDryRunBalances(): Promise<void> {
    const paper = this.exchange?.paperExchange;
    if (!paper) return;

    try {
      const rows = await prisma.balanceSnapshot.findMany({
        where: { botId: this.botId, isDryRun: true },
        orderBy: { timestamp: 'desc' },
        distinct: ['asset'],
      });
      if (rows.length === 0) return;

      const state: Record<string, { available: string; locked: string }> = {};
      for (const row of rows) {
        state[row.asset] = {
          available: row.available.toString(),
          locked: row.locked.toString(),
        };
      }
      paper.loadBalances(state);
      logger.info(`Bot ${this.botId}: rehydrated ${rows.length} dry-run balances from snapshots`);
    } catch (err) {
      logger.warn(`Bot ${this.botId}: balance rehydration failed: ${String((err as Error)?.message || err)}`);
    }
  }

  /**
   * LIVE-mode crash recovery: cancel OUR open orders from a previous run
   * before placing new ones (prevents duplicate grid orders). Only orders
   * whose clientOrderId is one of ours are ever canceled.
   */
  private async cleanRestartsOpenOrders(): Promise<void> {
    if (this.exchange!.mode !== TradingMode.LIVE) return;

    const open = await prisma.order.findMany({
      where: { botId: this.botId, status: { in: OPEN_DB_STATUSES } },
      select: { id: true, clientOrderId: true },
    });
    if (open.length === 0) return;

    const known = new Set(open.map(o => o.clientOrderId));
    try {
      const result = await this.exchange!.cancelAllOrders(this.bot!.symbol, {
        clientOrderIdFilter: id => known.has(id),
      });
      await prisma.order.updateMany({
        where: { botId: this.botId, status: { in: OPEN_DB_STATUSES } },
        data: { status: DbOrderStatus.CANCELED },
      });
      void writeEventLog({
        botId: this.botId,
        level: 'WARN',
        event: 'bot.restart_cleanup',
        message: `Canceled ${result.canceled.length} stale open orders before restart`,
      });
    } catch (err) {
      logger.warn(`Bot ${this.botId}: restart cleanup failed: ${String((err as Error)?.message || err)}`);
    }
  }

  private buildGridEngine(): GridEngine {
    const bot = this.bot!;
    const market = this.market!;
    const isDryRun = bot.mode === DbTradingMode.DRY_RUN;

    return new GridEngine({
      botId: this.botId,
      symbol: bot.symbol,
      config: { ...this.gridConfig! },
      market,
      exchange: this.exchange!,
      minNotionalFallback: workerConfig.minNotionalFallback,
      preTradeCheck: req => this.preTradeCheck(req),
      hooks: {
        onLevel: level => this.enqueueDb(() => this.persistLevel(level)),
        onOrder: event => this.enqueueDb(() => this.persistOrder(event)),
        onFill: fill => this.enqueueDb(() => this.persistFill(fill, isDryRun)),
        onStats: stats => {
          void this.onStats(stats);
        },
        onEvent: (level, event, message, data) => {
          void writeEventLog({
            botId: this.botId,
            level,
            event,
            message,
            data: data as Record<string, unknown> | undefined,
          });
        },
      },
    });
  }

  // ==========================================================================
  // Market data
  // ==========================================================================

  private async subscribeMarketData(): Promise<void> {
    const service = this.exchange!.marketDataService;
    const exchange = this.exchange!;
    const symbol = this.bot!.symbol;

    this.marketDataHandler = (md: MarketData) => {
      if (!this.grid || !md.price || md.symbol !== symbol) return;
      try {
        if (exchange.mode === TradingMode.DRY_RUN) {
          exchange.updatePrice(symbol, md.price);
        }
        const depth = md.bid || md.ask ? { bestBid: md.bid, bestAsk: md.ask } : undefined;
        void this.grid.onPriceTick(md.price, depth).catch(err => {
          logger.warn(`Bot ${this.botId}: tick handling error: ${String(err?.message || err)}`);
        });

        if (service.isPriceStale(symbol) && !this.staleLogged) {
          this.staleLogged = true;
          this.deps.events.publish('price.stale', { botId: this.botId, symbol });
          void writeEventLog({
            botId: this.botId,
            level: 'WARN',
            event: 'market.stale_price',
            message: `Price feed for ${symbol} is stale; placements paused`,
          });
        } else if (!service.isPriceStale(symbol)) {
          this.staleLogged = false;
        }
      } catch (err) {
        logger.warn(`Bot ${this.botId}: market data handler error: ${String((err as Error)?.message || err)}`);
      }
    };

    service.on('price.update', this.marketDataHandler);
    service.subscribe(symbol);
  }

  private async primeInitialPrice(): Promise<void> {
    const symbol = this.bot!.symbol;
    try {
      const ticker = await this.exchange!.getTicker(symbol);
      if (ticker?.lastPrice) {
        const service = this.exchange!.marketDataService;
        const md = service.getMarketData(symbol);
        await this.grid!.onPriceTick(ticker.lastPrice, {
          bestBid: md?.bid ?? ticker.bidPrice,
          bestAsk: md?.ask ?? ticker.askPrice,
        });
        return;
      }
    } catch (err) {
      logger.warn(`Bot ${this.botId}: initial price fetch failed: ${String((err as Error)?.message || err)}`);
    }
    void writeEventLog({
      botId: this.botId,
      level: 'WARN',
      event: 'market.no_initial_price',
      message: 'No initial price available; waiting for first market data tick',
    });
  }

  // ==========================================================================
  // Exchange events → engine + DB
  // ==========================================================================

  private wireExchangeEvents(): void {
    const exchange = this.exchange!;

    this.orderUpdateHandler = (payload: unknown) => {
      void this.handleOrderUpdateEvent(payload);
    };
    exchange.on('order.update', this.orderUpdateHandler);
  }

  private async handleOrderUpdateEvent(payload: unknown): Promise<void> {
    if (!this.grid || !this.exchange) return;
    const p = payload as Record<string, unknown> | null;
    if (!p || typeof p !== 'object') return;

    // Paper events arrive already mapped to PlacedOrder; live WS payloads are raw.
    const mapped: PlacedOrder | undefined =
      p.quantity !== undefined && p.clientOrderId !== undefined
        ? (p as unknown as PlacedOrder)
        : this.exchange.normalizeOrderEvent(payload);
    if (!mapped || mapped.symbol !== this.bot?.symbol) return;

    try {
      // Update the DB order record
      await this.enqueueDb(() =>
        prisma.order
          .updateMany({
            where: { botId: this.botId, clientOrderId: mapped.clientOrderId },
            data: {
              status: mapped.status as unknown as DbOrderStatus,
              executedQty: mapped.executedQty || '0',
              executedSum: mapped.executedSum || '0',
              fee: mapped.fee || '0',
              ...(mapped.status === OrderStatus.FILLED ? { executedAt: new Date() } : {}),
            },
          })
          .then(() => undefined),
      );

      this.deps.events.publish('order.update', {
        botId: this.botId,
        clientOrderId: mapped.clientOrderId,
        side: mapped.side,
        status: mapped.status,
        price: mapped.price,
        quantity: mapped.quantity,
        executedQty: mapped.executedQty,
      });

      const terminal =
        mapped.status === OrderStatus.FILLED ||
        mapped.status === OrderStatus.CANCELED ||
        mapped.status === OrderStatus.REJECTED ||
        mapped.status === OrderStatus.EXPIRED;
      if (terminal) this.knownOrders.delete(mapped.clientOrderId);

      // Engine accounting (fill deltas + level state). Fills flow through the
      // onFill hook → DB Fill rows. Safe against duplicate events (dedupe in engine).
      await this.grid.handleOrderUpdate(mapped);
    } catch (err) {
      logger.warn(
        `Bot ${this.botId}: order update handling failed for ${mapped.clientOrderId}: ${String((err as Error)?.message || err)}`,
      );
    }
  }

  // ==========================================================================
  // Risk gate
  // ==========================================================================

  private async preTradeCheck(req: PlaceOrderRequest) {
    const bot = this.bot!;
    const market = this.market!;

    return this.deps.risk.check(req, {
      botId: this.botId,
      symbol: bot.symbol,
      mode: this.exchange!.mode,
      isLiveEnabledAccount: this.account?.isLiveEnabled ?? false,
      isPriceStale: () => {
        try {
          return this.exchange!.marketDataService.isPriceStale(bot.symbol);
        } catch {
          return true;
        }
      },
      maxQuoteExposure: bot.maxQuoteExposure?.toString() ?? this.gridConfig?.maxQuoteExposure,
      maxBaseExposure: bot.maxBaseExposure?.toString() ?? this.gridConfig?.maxBaseExposure,
      dailyLossLimitPercent: bot.dailyLossLimitPercent?.toString() ?? undefined,
      openExposure: () => {
        let quoteNotional = new Decimal(0);
        let baseQty = new Decimal(0);
        for (const o of this.knownOrders.values()) {
          if (o.side === OrderSide.BUY) quoteNotional = quoteNotional.plus(new Decimal(o.price).times(o.quantity));
          else baseQty = baseQty.plus(o.quantity);
        }
        return { quoteNotional: quoteNotional.toFixed(8), baseQty: baseQty.toFixed(8) };
      },
      referenceCapitalQuote:
        this.gridConfig?.totalInvestmentQuote ||
        (this.gridConfig?.quotePerGrid
          ? new Decimal(this.gridConfig.quotePerGrid).times(Math.max(this.gridConfig.gridCount, 1)).toFixed(8)
          : undefined),
    });
  }

  // ==========================================================================
  // Persistence hooks
  // ==========================================================================

  /** Serialize DB writes to keep hook ordering consistent. */
  private enqueueDb<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.dbQueue.then(fn, () => fn());
    this.dbQueue = run.then(() => undefined, () => undefined);
    return run;
  }

  private async persistLevel(level: GridLevelState): Promise<void> {
    await prisma.gridLevel.upsert({
      where: { botId_levelIndex: { botId: this.botId, levelIndex: level.levelIndex } },
      update: {
        price: level.price,
        status: level.status as never,
        buyOrderId: level.buyOrderId,
        sellOrderId: level.sellOrderId,
        filledQuantity: level.filledQuantity,
        averageCost: level.averageCost,
      },
      create: {
        botId: this.botId,
        levelIndex: level.levelIndex,
        price: level.price,
        status: level.status as never,
        buyOrderId: level.buyOrderId,
        sellOrderId: level.sellOrderId,
        filledQuantity: level.filledQuantity,
        averageCost: level.averageCost,
      },
    });
  }

  private async persistOrder(event: {
    action: 'PLACE' | 'CANCEL' | 'FAILED';
    request: PlaceOrderRequest;
    result?: PlacedOrder;
    reason?: string;
  }): Promise<void> {
    const { action, request, result, reason } = event;

    if (action === 'PLACE') {
      this.knownOrders.set(request.clientOrderId, {
        side: request.side,
        price: request.price,
        quantity: request.quantity,
      });
      await prisma.order.upsert({
        where: { clientOrderId: request.clientOrderId },
        update: {
          status: (result?.status ?? OrderStatus.NEW) as unknown as DbOrderStatus,
          price: request.price,
          quantity: request.quantity,
          executedQty: result?.executedQty || '0',
        },
        create: {
          botId: this.botId,
          clientOrderId: request.clientOrderId,
          exchangeOrderId: result?.exchangeOrderId,
          symbol: request.symbol,
          side: request.side as never,
          type: request.type as never,
          status: (result?.status ?? OrderStatus.NEW) as unknown as DbOrderStatus,
          price: request.price,
          quantity: request.quantity,
          executedQty: result?.executedQty || '0',
          executedSum: result?.executedSum || '0',
          fee: result?.fee || '0',
          isDryRun: this.exchange?.mode !== TradingMode.LIVE,
          metadata: { levelTrigger: 'grid-engine' },
        },
      });
      return;
    }

    if (action === 'CANCEL') {
      this.knownOrders.delete(request.clientOrderId);
      await prisma.order.updateMany({
        where: { botId: this.botId, clientOrderId: request.clientOrderId },
        data: { status: DbOrderStatus.CANCELED },
      });
      return;
    }

    // FAILED
    this.knownOrders.delete(request.clientOrderId);
    await prisma.order.updateMany({
      where: { botId: this.botId, clientOrderId: request.clientOrderId },
      data: { status: DbOrderStatus.REJECTED },
    });
    if (reason) {
      void writeEventLog({
        botId: this.botId,
        level: 'WARN',
        event: 'order.rejected',
        message: `Order ${request.clientOrderId} rejected: ${reason}`,
      });
    }
  }

  private async persistFill(fill: GridFillEvent, isDryRun: boolean): Promise<void> {
    const order = await this.ensureOrderRecord(fill);
    const price = new Decimal(fill.price);
    const quantity = new Decimal(fill.quantity);

    await prisma.fill.create({
      data: {
        botId: this.botId,
        orderId: order.id,
        price: fill.price,
        quantity: fill.quantity,
        sum: price.times(quantity).toFixed(16),
        fee: fill.fee,
        feeAsset: fill.feeAsset,
        isBuyer: fill.side === OrderSide.BUY,
        isMaker: fill.isMaker,
        isDryRun,
        timestamp: new Date(fill.timestamp),
      },
    });

    const isBuy = fill.side === OrderSide.BUY;
    await prisma.bot.update({
      where: { id: this.botId },
      data: {
        ...(isBuy ? { totalBuys: { increment: 1 } } : { totalSells: { increment: 1 } }),
        totalFeesPaid: { increment: new Decimal(fill.fee).toNumber() },
        ...(isBuy ? {} : { realizedPnL: { increment: new Decimal(fill.realizedPnL ?? '0').toNumber() } }),
      },
    });

    if (isDryRun) {
      await this.persistBalances();
    }

    this.deps.events.publish('fill.new', {
      botId: this.botId,
      levelIndex: fill.levelIndex,
      side: fill.side,
      price: fill.price,
      quantity: fill.quantity,
      fee: fill.fee,
      realizedPnL: fill.realizedPnL,
    });
  }

  private async ensureOrderRecord(fill: GridFillEvent): Promise<Order> {
    const existing = await prisma.order.findUnique({ where: { clientOrderId: fill.clientOrderId } });
    if (existing) return existing;

    const known = this.knownOrders.get(fill.clientOrderId);
    return prisma.order.create({
      data: {
        botId: this.botId,
        clientOrderId: fill.clientOrderId,
        symbol: this.bot!.symbol,
        side: (fill.side === OrderSide.BUY ? 'BUY' : 'SELL') as never,
        type: 'LIMIT' as never,
        status: DbOrderStatus.FILLED,
        price: fill.price,
        quantity: fill.quantity,
        executedQty: fill.quantity,
        executedSum: new Decimal(fill.price).times(fill.quantity).toFixed(16),
        fee: fill.fee,
        feeAsset: fill.feeAsset,
        isDryRun: this.exchange?.mode !== TradingMode.LIVE,
        executedAt: new Date(fill.timestamp),
        metadata: { levelIndex: fill.levelIndex, source: known ? 'grid-engine' : 'reconstructed' },
      },
    });
  }

  private async onStats(stats: GridMetrics): Promise<void> {
    const now = Date.now();
    if (now - this.lastStatsFlush < 2000) return;
    this.lastStatsFlush = now;

    const cycleDelta = Math.max(stats.completedCycles - this.lastCycles, 0);
    this.lastCycles = stats.completedCycles;

    try {
      await prisma.bot.update({
        where: { id: this.botId },
        data: {
          unrealizedPnL: new Decimal(stats.unrealizedPnL).toNumber(),
          ...(cycleDelta > 0 ? { totalGridCycles: { increment: cycleDelta } } : {}),
        },
      });
    } catch (err) {
      logger.warn(`Bot ${this.botId}: stats flush failed: ${String((err as Error)?.message || err)}`);
    }

    this.deps.events.publish('bot.stats', { botId: this.botId, ...stats });
  }

  private async flushStats(force = false): Promise<void> {
    if (!this.grid) return;
    if (!force && Date.now() - this.lastStatsFlush < 2000) return;
    this.lastStatsFlush = 0;
    await this.onStats(this.grid.getMetrics());
  }

  /** Persist paper balances (DRY_RUN) for rehydration on restart. */
  async persistBalances(): Promise<void> {
    if (this.exchange?.mode !== TradingMode.DRY_RUN) return;
    const paper = this.exchange.paperExchange;
    if (!paper) return;

    try {
      const balances = await this.exchange.getBalances();
      const rows = Object.values(balances).map((b: Balance) => ({
        exchangeAccountId: this.account?.id,
        botId: this.botId,
        asset: b.asset,
        total: b.total,
        available: b.available,
        locked: b.locked,
        isDryRun: true,
      }));
      if (rows.length > 0) {
        await prisma.balanceSnapshot.createMany({ data: rows as never });
      }
    } catch (err) {
      logger.warn(`Bot ${this.botId}: balance persistence failed: ${String((err as Error)?.message || err)}`);
    }
  }

  /** Write a PnLSnapshot row + refresh Bot PnL fields. */
  async snapshotPnl(): Promise<void> {
    if (!this.grid || !this.market || !this.exchange) return;
    try {
      const metrics = this.grid.getMetrics();
      const balances = await this.exchange.getBalances();
      const base = balances[this.market.baseAsset];
      const quote = balances[this.market.quoteAsset];

      const bot = await prisma.bot.findUnique({
        where: { id: this.botId },
        select: { realizedPnL: true, totalFeesPaid: true },
      });
      const realized = bot?.realizedPnL ?? 0;
      const fees = bot?.totalFeesPaid ?? 0;
      const unrealized = new Decimal(metrics.unrealizedPnL);

      await prisma.pnLSnapshot.create({
        data: {
          botId: this.botId,
          realizedPnL: realized.toString(),
          unrealizedPnL: metrics.unrealizedPnL,
          totalPnL: new Decimal(realized.toString()).plus(unrealized).toFixed(16),
          feesPaid: fees.toString(),
          baseBalance: base?.total ?? '0',
          quoteBalance: quote?.total ?? '0',
        },
      });
    } catch (err) {
      logger.warn(`Bot ${this.botId}: PnL snapshot failed: ${String((err as Error)?.message || err)}`);
    }
  }

  // ==========================================================================
  // Reconciliation
  // ==========================================================================

  /**
   * Compare exchange open orders vs DB open orders (exact clientOrderId match).
   * Orphans (unknown IDs) are NEVER canceled — logged only. Missing (DB-open
   * but not on the exchange) are resolved via getOrder and fed to the engine.
   */
  async reconcile(): Promise<{ orphans: string[]; missing: string[]; ok: boolean } | undefined> {
    if (!this.exchange || !this.bot) return undefined;

    const report = { orphans: [] as string[], missing: [] as string[], ok: true };

    try {
      const [exchangeOpen, dbOpen] = await Promise.all([
        this.exchange.getOpenOrders(this.bot.symbol).catch(() => [] as PlacedOrder[]),
        prisma.order.findMany({
          where: { botId: this.botId, status: { in: OPEN_DB_STATUSES } },
          select: { clientOrderId: true },
        }),
      ]);

      const { orphans, missing } = diffOpenOrders(exchangeOpen, dbOpen.map(o => o.clientOrderId));
      report.orphans = orphans;
      report.missing = missing;

      // Track known exchange orders; orphans are never canceled, only logged
      const orphanSet = new Set(orphans);
      for (const order of exchangeOpen) {
        if (orphanSet.has(order.clientOrderId)) continue;
        this.knownOrders.set(order.clientOrderId, {
          side: order.side,
          price: order.price,
          quantity: order.quantity,
        });
      }
      if (report.orphans.length > 0) {
        void writeEventLog({
          botId: this.botId,
          level: 'WARN',
          event: 'reconcile.orphan_orders',
          message: `${report.orphans.length} unknown open order(s) on exchange left untouched: ${report.orphans.join(', ').slice(0, 500)}`,
        });
      }

      // Missing: DB says open, exchange says not open → discover what happened
      for (const row of dbOpen) {
        if (!missing.includes(row.clientOrderId)) continue;

        const final = await this.exchange.getOrder(row.clientOrderId).catch(() => undefined);
        if (!final) {
          void writeEventLog({
            botId: this.botId,
            level: 'WARN',
            event: 'reconcile.missing_order',
            message: `Order ${row.clientOrderId} open in DB but not found on exchange`,
          });
          continue;
        }

        await prisma.order
          .updateMany({
            where: { botId: this.botId, clientOrderId: row.clientOrderId },
            data: {
              status: final.status as unknown as DbOrderStatus,
              executedQty: final.executedQty,
              executedSum: final.executedSum || '0',
              fee: final.fee || '0',
            },
          })
          .catch(() => undefined);

        if (
          final.status === OrderStatus.FILLED ||
          final.status === OrderStatus.PARTIALLY_FILLED
        ) {
          // Let the engine apply any unrecorded fill delta
          if (this.grid) await this.grid.handleOrderUpdate(final).catch(() => undefined);
        }
        this.knownOrders.delete(row.clientOrderId);
      }

      if (report.missing.length > 0 || report.orphans.length > 0) {
        logger.info(
          `Bot ${this.botId}: reconciliation found ${report.missing.length} missing, ${report.orphans.length} orphan orders`,
        );
      }
    } catch (err) {
      report.ok = false;
      logger.warn(`Bot ${this.botId}: reconciliation failed: ${String((err as Error)?.message || err)}`);
    }

    this.deps.events.publish('reconciliation.report', { botId: this.botId, ...report });
    return report;
  }

  private async markOpenOrdersCanceled(): Promise<void> {
    await prisma.order
      .updateMany({
        where: { botId: this.botId, status: { in: OPEN_DB_STATUSES } },
        data: { status: DbOrderStatus.CANCELED },
      })
      .catch(() => undefined);
  }

  // ==========================================================================
  // Teardown / status
  // ==========================================================================

  private async teardown(): Promise<void> {
    this.shuttingDown = true;

    if (this.lockTimer) {
      clearInterval(this.lockTimer);
      this.lockTimer = undefined;
    }

    if (this.marketDataHandler) {
      try {
        this.exchange?.marketDataService.off('price.update', this.marketDataHandler);
        if (this.bot) this.exchange?.marketDataService.unsubscribe(this.bot.symbol);
      } catch {
        /* noop */
      }
      this.marketDataHandler = undefined;
    }

    if (this.orderUpdateHandler && this.exchange) {
      this.exchange.off('order.update', this.orderUpdateHandler);
      this.orderUpdateHandler = undefined;
    }

    try {
      this.exchange?.close();
    } catch {
      /* noop */
    }

    if (this.lockValue) {
      await this.deps.lock.release(this.lockKey, this.lockValue).catch(() => false);
      this.lockValue = undefined;
    }

    // Let queued DB writes drain
    await this.dbQueue.catch(() => undefined);

    this.grid = undefined;
    this.exchange = undefined;
    this.knownOrders.clear();
    this.shuttingDown = false;
  }

  private startLockRenewal(): void {
    this.lockTimer = setInterval(async () => {
      if (!this.lockValue) return;
      const ok = await this.deps.lock
        .extend(this.lockKey, this.lockValue, workerConfig.botLockTtlMs)
        .catch(() => false);
      if (!ok) {
        logger.error(`Bot ${this.botId}: lost lock ownership — stopping engine`);
        await this.stop(BotStatus.ERROR, 'lost distributed lock');
      }
    }, workerConfig.botLockRenewMs);
  }

  // ==========================================================================
  // Engine lifecycle events (SL/TP, range exit)
  // ==========================================================================

  private wireLifecycleEvents(grid: GridEngine): void {
    grid.on('lifecycle', (action: LifecycleAction) => {
      void this.handleLifecycle(action);
    });
    grid.on('grid.recentered', (info: { lower: string; upper: string; reason?: string }) => {
      void this.handleRecentered(info);
    });
  }

  private async handleLifecycle(action: LifecycleAction): Promise<void> {
    const isRangeExit = action.reason.includes('range');
    const finalStatus =
      action.action === 'STOP'
        ? isRangeExit
          ? BotStatus.RANGE_EXITED
          : BotStatus.STOPPED
        : isRangeExit
          ? BotStatus.RANGE_EXITED
          : BotStatus.PAUSED;

    await this.flushStats(true);
    await this.persistBalances();
    await this.snapshotPnl();
    await this.markOpenOrdersCanceled();
    await this.teardown();
    await prisma.bot
      .update({ where: { id: this.botId }, data: { stoppedAt: new Date() } })
      .catch(() => undefined);
    await this.setStatus(finalStatus, `${action.action.toLowerCase()}: ${action.reason}`);
  }

  private async handleRecentered(info: { lower: string; upper: string; reason?: string }): Promise<void> {
    if (!this.gridConfig) return;
    this.gridConfig = { ...this.gridConfig, lowerPrice: info.lower, upperPrice: info.upper };
    await prisma.bot
      .update({
        where: { id: this.botId },
        data: { gridConfig: { ...this.gridConfig } as object },
      })
      .catch(err => logger.warn(`Bot ${this.botId}: failed to persist recentered range: ${String(err?.message || err)}`));
    void writeEventLog({
      botId: this.botId,
      level: 'INFO',
      event: 'grid.recentered',
      message: `Grid range shifted to [${info.lower}, ${info.upper}]${info.reason ? ` (${info.reason})` : ''}`,
    });
  }

  private async setStatus(status: BotStatus, reason?: string): Promise<void> {
    try {
      await prisma.bot.update({ where: { id: this.botId }, data: { status } });
    } catch (err) {
      logger.warn(`Bot ${this.botId}: status update failed: ${String((err as Error)?.message || err)}`);
    }
    this.deps.events.publish('bot.status', { botId: this.botId, status, reason });
  }

  private async fail(reason: string): Promise<void> {
    void writeEventLog({ botId: this.botId, level: 'ERROR', event: 'bot.error', message: reason });
    await this.setStatus(BotStatus.ERROR, reason);
  }
}
