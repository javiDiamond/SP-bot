import { Bot, ExchangeAccount } from '@wallex/db';
import type { GridConfig as GridConfigType } from '@wallex/shared';
import { 
  logger, 
  BotStatus, 
  OrderStatus,
  GridLevelStatus,
  generateClientOrderId,
  DecimalUtils,
  GridMath,
  OrderSide
} from '@wallex/shared';
import { WallexExchange } from '@wallex/exchange';
import { EventEmitter } from 'events';
import { prisma } from '@wallex/db';
import Decimal from 'decimal.js';

interface LocalGridLevel {
  levelIndex: number;
  price: string;
  side: 'BUY' | 'SELL';
  status: GridLevelStatus;
  buyOrderId?: string;
  sellOrderId?: string;
  filledQuantity: string;
}

export interface OrderPlacedEvent {
  botId: string;
  orderId: string;
  clientId: string;
  side: 'BUY' | 'SELL';
  price: string;
  quantity: string;
}

export interface OrderFilledEvent {
  botId: string;
  orderId: string;
  fillId: string;
  side: 'BUY' | 'SELL';
  price: string;
  quantity: string;
  fee: string;
}

export class BotEngine extends EventEmitter {
  private bot: Bot;
  private gridConfig: GridConfigType;
  private exchangeAccount: ExchangeAccount;
  private exchange: WallexExchange;
  private status: BotStatus = BotStatus.DRAFT;
  private gridLevels: Map<number, LocalGridLevel> = new Map();
  private activeOrders: Map<string, any> = new Map();
  private reconciliationInterval?: NodeJS.Timeout;
  private isHealthyFlag = true;

  constructor(
    bot: Bot,
    gridConfig: GridConfigType,
    exchangeAccount: ExchangeAccount
  ) {
    super();
    this.bot = bot;
    this.gridConfig = gridConfig;
    this.exchangeAccount = exchangeAccount;
    
    // Initialize exchange adapter - convert TradingMode to ExchangeMode
    const mode = bot.mode === 'DRY_RUN' ? 1 : 0; // DRY_RUN=1, LIVE=0
    
    this.exchange = new WallexExchange({
      apiKey: (exchangeAccount as any).apiKeyEncrypted, // Will be decrypted by ExchangeAccount getter
      mode: mode as any,
      symbol: bot.symbol,
    });
  }

  async start(): Promise<void> {
    if (this.status === BotStatus.RUNNING) {
      logger.warn(`Bot ${this.bot.id} is already running`);
      return;
    }

    try {
      logger.info(`Starting bot ${this.bot.id}`);
      
      // Update status
      await this.updateStatus(BotStatus.STARTING);

      // Validate configuration
      await this.validateConfig();

      // Generate grid levels
      await this.generateGridLevels();

      // Reconcile existing orders
      await this.reconcileOrders();

      // Place initial orders
      await this.placeInitialOrders();

      // Start reconciliation loop
      this.startReconciliationLoop();

      // Update status to running
      await this.updateStatus(BotStatus.RUNNING);

      logger.info(`Bot ${this.bot.id} started successfully`);
      this.emit('status_change', this.status);
    } catch (error) {
      logger.error(`Failed to start bot ${this.bot.id}`, error);
      await this.updateStatus(BotStatus.ERROR);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.status === BotStatus.STOPPED) {
      return;
    }

    logger.info(`Stopping bot ${this.bot.id}`);
    
    try {
      await this.updateStatus(BotStatus.STOPPING);

      // Stop reconciliation loop
      if (this.reconciliationInterval) {
        clearInterval(this.reconciliationInterval);
      }

      // Cancel all orders
      await this.cancelAllOrders();

      // Update status
      await this.updateStatus(BotStatus.STOPPED);

      logger.info(`Bot ${this.bot.id} stopped`);
      this.emit('status_change', this.status);
    } catch (error) {
      logger.error(`Error stopping bot ${this.bot.id}`, error);
      await this.updateStatus(BotStatus.ERROR);
      throw error;
    }
  }

  async pause(): Promise<void> {
    if (this.status !== BotStatus.RUNNING) {
      logger.warn(`Bot ${this.bot.id} is not running, cannot pause`);
      return;
    }

    logger.info(`Pausing bot ${this.bot.id}`);
    
    try {
      await this.updateStatus(BotStatus.PAUSING);

      // Optionally cancel orders based on config
      if (this.gridConfig.onRangeExit === 'PAUSE_CANCEL_ALL') {
        await this.cancelAllOrders();
      }

      await this.updateStatus(BotStatus.PAUSED);
      logger.info(`Bot ${this.bot.id} paused`);
      this.emit('status_change', this.status);
    } catch (error) {
      logger.error(`Error pausing bot ${this.bot.id}`, error);
      await this.updateStatus(BotStatus.ERROR);
      throw error;
    }
  }

  async resume(): Promise<void> {
    if (this.status !== BotStatus.PAUSED) {
      logger.warn(`Bot ${this.bot.id} is not paused, cannot resume`);
      return;
    }

    logger.info(`Resuming bot ${this.bot.id}`);
    
    try {
      await this.updateStatus(BotStatus.RUNNING);

      // Reconcile and restore orders
      await this.reconcileOrders();
      await this.placeInitialOrders();

      // Restart reconciliation loop
      this.startReconciliationLoop();

      logger.info(`Bot ${this.bot.id} resumed`);
      this.emit('status_change', this.status);
    } catch (error) {
      logger.error(`Error resuming bot ${this.bot.id}`, error);
      await this.updateStatus(BotStatus.ERROR);
      throw error;
    }
  }

  async cancelAllOrders(): Promise<void> {
    logger.info(`Cancelling all orders for bot ${this.bot.id}`);

    const ordersToCancel = Array.from(this.activeOrders.values());
    
    for (const order of ordersToCancel) {
      try {
        await this.exchange.cancelOrder(order.clientOrderId);
        this.activeOrders.delete(order.clientOrderId);
        
        // Update order in database
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELED },
        });
      } catch (error) {
        logger.error(`Failed to cancel order ${order.clientOrderId}`, error);
      }
    }

    logger.info(`Cancelled ${ordersToCancel.length} orders for bot ${this.bot.id}`);
  }

  isHealthy(): boolean {
    return this.isHealthyFlag && this.status === BotStatus.RUNNING;
  }

  private async validateConfig(): Promise<void> {
    const { lowerPrice, upperPrice, gridCount } = this.gridConfig;

    if (lowerPrice >= upperPrice) {
      throw new Error('Lower price must be less than upper price');
    }

    if (gridCount < 2) {
      throw new Error('Grid count must be at least 2');
    }

    // Get market info
    const market = await this.exchange.getMarket(this.bot.symbol);
    if (!market) {
      throw new Error(`Market ${this.bot.symbol} not found`);
    }

    // Validate grid spacing vs fees
    const minProfitBps = this.gridConfig.minProfitAfterFeesBps || 10;
    const gridSpacingPercent = GridMath.calculateGridSpacingPercent(
      lowerPrice,
      upperPrice,
      gridCount,
      this.gridConfig.gridType
    );

    const fees = await this.exchange.getFees(this.bot.symbol);
    const totalFeesBps = (fees.makerFeeRate + fees.takerFeeRate) * 10000;

    if (gridSpacingPercent * 10000 < totalFeesBps + minProfitBps) {
      throw new Error(
        `Grid spacing (${(gridSpacingPercent * 100).toFixed(2)}%) is too small. ` +
        `Required minimum: ${(totalFeesBps + minProfitBps) / 100}% (fees + min profit)`
      );
    }

    logger.info(`Bot ${this.bot.id} configuration validated`);
  }

  private async generateGridLevels(): Promise<void> {
    const { lowerPrice, upperPrice, gridCount, gridType } = this.gridConfig;
    
    const market = await this.exchange.getMarket(this.bot.symbol);
    if (!market) {
      throw new Error(`Market ${this.bot.symbol} not found`);
    }

    const levels = GridMath.generateGridLevels(
      lowerPrice,
      upperPrice,
      gridCount,
      gridType,
      market.pricePrecision
    );

    this.gridLevels.clear();
    levels.forEach((level, index) => {
      this.gridLevels.set(index, {
        levelIndex: index,
        price: level.price,
        side: level.type === 'BUY' ? 'BUY' : 'SELL',
        status: 'IDLE',
        filledQuantity: '0',
      });
    });

    logger.info(`Generated ${levels.length} grid levels for bot ${this.bot.id}`);
  }

  private async reconcileOrders(): Promise<void> {
    logger.info(`Reconciling orders for bot ${this.bot.id}`);

    try {
      // Get open orders from exchange
      const openOrders = await this.exchange.getOpenOrders(this.bot.symbol);
      
      // Filter orders belonging to this bot
      const botOrders = openOrders.filter(order => 
        order.clientOrderId?.startsWith(`GB_${this.bot.id}_`)
      );

      // Update local state
      botOrders.forEach(order => {
        this.activeOrders.set(order.clientOrderId, order);
      });

      logger.info(`Reconciled ${botOrders.length} orders for bot ${this.bot.id}`);
    } catch (error) {
      logger.error(`Failed to reconcile orders for bot ${this.bot.id}`, error);
    }
  }

  private async placeInitialOrders(): Promise<void> {
    logger.info(`Placing initial orders for bot ${this.bot.id}`);

    // Get current price
    const ticker = await this.exchange.getTicker(this.bot.symbol);
    if (!ticker) {
      throw new Error(`Could not get ticker for ${this.bot.symbol}`);
    }

    const currentPrice = new Decimal(ticker.lastPrice);

    // Place buy orders below current price
    for (const [index, level] of this.gridLevels.entries()) {
      if (level.side !== 'BUY') continue;
      
      const levelPrice = new Decimal(level.price);
      if (levelPrice.greaterThanOrEqualTo(currentPrice)) continue;

      // Check if order already exists
      const clientId = generateClientOrderId(this.bot.id, 'BUY', index);
      if (this.activeOrders.has(clientId)) {
        continue;
      }

      // Calculate quantity
      const quantity = this.calculateOrderQuantity(levelPrice, 'BUY');
      if (quantity.lessThanOrEqualTo(0)) {
        logger.warn(`Invalid quantity for buy order at level ${index}`);
        continue;
      }

      // Place order
      try {
        const order = await this.exchange.placeOrder({
          symbol: this.bot.symbol,
          side: 'BUY',
          type: 'LIMIT',
          price: levelPrice.toString(),
          quantity: quantity.toString(),
          clientOrderId: clientId,
        });

        this.activeOrders.set(clientId, order);

        // Save to database
        await prisma.order.create({
          data: {
            id: order.orderId,
            botId: this.bot.id,
            clientId,
            symbol: this.bot.symbol,
            side: 'BUY',
            type: 'LIMIT',
            price: levelPrice.toString(),
            quantity: quantity.toString(),
            status: OrderStatus.NEW,
            mode: this.bot.mode,
          },
        });

        this.emit('order_placed', {
          botId: this.bot.id,
          orderId: order.orderId,
          clientId,
          side: 'BUY',
          price: levelPrice.toString(),
          quantity: quantity.toString(),
        });

        logger.info(`Placed buy order at level ${index}: ${quantity} @ ${levelPrice}`);
      } catch (error) {
        logger.error(`Failed to place buy order at level ${index}`, error);
      }
    }

    // Place sell orders above current price
    for (const [index, level] of this.gridLevels.entries()) {
      if (level.side !== 'SELL') continue;
      
      const levelPrice = new Decimal(level.price);
      if (levelPrice.lessThanOrEqualTo(currentPrice)) continue;

      // Check if order already exists
      const clientId = generateClientOrderId(this.bot.id, 'SELL', index);
      if (this.activeOrders.has(clientId)) {
        continue;
      }

      // Calculate quantity
      const quantity = this.calculateOrderQuantity(levelPrice, 'SELL');
      if (quantity.lessThanOrEqualTo(0)) {
        logger.warn(`Invalid quantity for sell order at level ${index}`);
        continue;
      }

      // Place order
      try {
        const order = await this.exchange.placeOrder({
          symbol: this.bot.symbol,
          side: 'SELL',
          type: 'LIMIT',
          price: levelPrice.toString(),
          quantity: quantity.toString(),
          clientOrderId: clientId,
        });

        this.activeOrders.set(clientId, order);

        // Save to database
        await prisma.order.create({
          data: {
            id: order.orderId,
            botId: this.bot.id,
            clientId,
            symbol: this.bot.symbol,
            side: 'SELL',
            type: 'LIMIT',
            price: levelPrice.toString(),
            quantity: quantity.toString(),
            status: OrderStatus.NEW,
            mode: this.bot.mode,
          },
        });

        this.emit('order_placed', {
          botId: this.bot.id,
          orderId: order.orderId,
          clientId,
          side: 'SELL',
          price: levelPrice.toString(),
          quantity: quantity.toString(),
        });

        logger.info(`Placed sell order at level ${index}: ${quantity} @ ${levelPrice}`);
      } catch (error) {
        logger.error(`Failed to place sell order at level ${index}`, error);
      }
    }
  }

  private calculateOrderQuantity(price: Decimal, side: 'BUY' | 'SELL'): Decimal {
    // Simplified quantity calculation
    // In production, this would consider:
    // - Available balance
    // - Quote/base per grid
    // - Minimum order size
    // - Precision rounding
    
    const totalInvestment = new Decimal(
      this.gridConfig.totalInvestmentQuote?.toString() || '1000'
    );
    const gridCount = new Decimal(this.gridConfig.gridCount);
    
    const quotePerGrid = totalInvestment.dividedBy(gridCount);
    
    if (side === 'BUY') {
      return quotePerGrid.dividedBy(price);
    } else {
      // For sell orders, use base amount
      // This is simplified - in reality would track filled buy orders
      return quotePerGrid.dividedBy(price);
    }
  }

  private startReconciliationLoop(): void {
    const intervalMs = parseInt(process.env.REST_POLL_INTERVAL_MS || '5000');
    
    this.reconciliationInterval = setInterval(async () => {
      try {
        await this.reconcileOrders();
      } catch (error) {
        logger.error(`Reconciliation failed for bot ${this.bot.id}`, error);
      }
    }, intervalMs);
  }

  private async updateStatus(status: BotStatus): Promise<void> {
    this.status = status;
    
    await prisma.bot.update({
      where: { id: this.bot.id },
      data: { status },
    });
  }
}
