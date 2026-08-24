"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotEngine = void 0;
const shared_1 = require("@wallex/shared");
const exchange_1 = require("@wallex/exchange");
const events_1 = require("events");
const db_1 = require("@wallex/db");
const decimal_js_1 = __importDefault(require("decimal.js"));
class BotEngine extends events_1.EventEmitter {
    bot;
    gridConfig;
    exchangeAccount;
    exchange;
    status = shared_1.BotStatus.DRAFT;
    gridLevels = new Map();
    activeOrders = new Map();
    reconciliationInterval;
    isHealthyFlag = true;
    constructor(bot, gridConfig, exchangeAccount) {
        super();
        this.bot = bot;
        this.gridConfig = gridConfig;
        this.exchangeAccount = exchangeAccount;
        // Initialize exchange adapter
        this.exchange = new exchange_1.WallexExchange({
            apiKey: exchangeAccount.apiKey, // Will be decrypted by ExchangeAccount getter
            mode: bot.mode,
            symbol: bot.symbol,
        });
    }
    async start() {
        if (this.status === shared_1.BotStatus.RUNNING) {
            shared_1.logger.warn(`Bot ${this.bot.id} is already running`);
            return;
        }
        try {
            shared_1.logger.info(`Starting bot ${this.bot.id}`);
            // Update status
            await this.updateStatus(shared_1.BotStatus.STARTING);
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
            await this.updateStatus(shared_1.BotStatus.RUNNING);
            shared_1.logger.info(`Bot ${this.bot.id} started successfully`);
            this.emit('status_change', this.status);
        }
        catch (error) {
            shared_1.logger.error(`Failed to start bot ${this.bot.id}`, error);
            await this.updateStatus(shared_1.BotStatus.ERROR);
            throw error;
        }
    }
    async stop() {
        if (this.status === shared_1.BotStatus.STOPPED) {
            return;
        }
        shared_1.logger.info(`Stopping bot ${this.bot.id}`);
        try {
            await this.updateStatus(shared_1.BotStatus.STOPPING);
            // Stop reconciliation loop
            if (this.reconciliationInterval) {
                clearInterval(this.reconciliationInterval);
            }
            // Cancel all orders
            await this.cancelAllOrders();
            // Update status
            await this.updateStatus(shared_1.BotStatus.STOPPED);
            shared_1.logger.info(`Bot ${this.bot.id} stopped`);
            this.emit('status_change', this.status);
        }
        catch (error) {
            shared_1.logger.error(`Error stopping bot ${this.bot.id}`, error);
            await this.updateStatus(shared_1.BotStatus.ERROR);
            throw error;
        }
    }
    async pause() {
        if (this.status !== shared_1.BotStatus.RUNNING) {
            shared_1.logger.warn(`Bot ${this.bot.id} is not running, cannot pause`);
            return;
        }
        shared_1.logger.info(`Pausing bot ${this.bot.id}`);
        try {
            await this.updateStatus(shared_1.BotStatus.PAUSING);
            // Optionally cancel orders based on config
            if (this.gridConfig.onRangeExit === 'PAUSE_CANCEL_ALL') {
                await this.cancelAllOrders();
            }
            await this.updateStatus(shared_1.BotStatus.PAUSED);
            shared_1.logger.info(`Bot ${this.bot.id} paused`);
            this.emit('status_change', this.status);
        }
        catch (error) {
            shared_1.logger.error(`Error pausing bot ${this.bot.id}`, error);
            await this.updateStatus(shared_1.BotStatus.ERROR);
            throw error;
        }
    }
    async resume() {
        if (this.status !== shared_1.BotStatus.PAUSED) {
            shared_1.logger.warn(`Bot ${this.bot.id} is not paused, cannot resume`);
            return;
        }
        shared_1.logger.info(`Resuming bot ${this.bot.id}`);
        try {
            await this.updateStatus(shared_1.BotStatus.RUNNING);
            // Reconcile and restore orders
            await this.reconcileOrders();
            await this.placeInitialOrders();
            // Restart reconciliation loop
            this.startReconciliationLoop();
            shared_1.logger.info(`Bot ${this.bot.id} resumed`);
            this.emit('status_change', this.status);
        }
        catch (error) {
            shared_1.logger.error(`Error resuming bot ${this.bot.id}`, error);
            await this.updateStatus(shared_1.BotStatus.ERROR);
            throw error;
        }
    }
    async cancelAllOrders() {
        shared_1.logger.info(`Cancelling all orders for bot ${this.bot.id}`);
        const ordersToCancel = Array.from(this.activeOrders.values());
        for (const order of ordersToCancel) {
            try {
                await this.exchange.cancelOrder(order.clientOrderId);
                this.activeOrders.delete(order.clientOrderId);
                // Update order in database
                await db_1.prisma.order.update({
                    where: { id: order.id },
                    data: { status: shared_1.OrderStatus.CANCELED },
                });
            }
            catch (error) {
                shared_1.logger.error(`Failed to cancel order ${order.clientOrderId}`, error);
            }
        }
        shared_1.logger.info(`Cancelled ${ordersToCancel.length} orders for bot ${this.bot.id}`);
    }
    isHealthy() {
        return this.isHealthyFlag && this.status === shared_1.BotStatus.RUNNING;
    }
    async validateConfig() {
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
        const gridSpacingPercent = shared_1.GridMath.calculateGridSpacingPercent(lowerPrice, upperPrice, gridCount, this.gridConfig.gridType);
        const fees = await this.exchange.getFees(this.bot.symbol);
        const totalFeesBps = (fees.makerFeeRate + fees.takerFeeRate) * 10000;
        if (gridSpacingPercent * 10000 < totalFeesBps + minProfitBps) {
            throw new Error(`Grid spacing (${(gridSpacingPercent * 100).toFixed(2)}%) is too small. ` +
                `Required minimum: ${(totalFeesBps + minProfitBps) / 100}% (fees + min profit)`);
        }
        shared_1.logger.info(`Bot ${this.bot.id} configuration validated`);
    }
    async generateGridLevels() {
        const { lowerPrice, upperPrice, gridCount, gridType } = this.gridConfig;
        const market = await this.exchange.getMarket(this.bot.symbol);
        if (!market) {
            throw new Error(`Market ${this.bot.symbol} not found`);
        }
        const levels = shared_1.GridMath.generateGridLevels(lowerPrice, upperPrice, gridCount, gridType, market.pricePrecision);
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
        shared_1.logger.info(`Generated ${levels.length} grid levels for bot ${this.bot.id}`);
    }
    async reconcileOrders() {
        shared_1.logger.info(`Reconciling orders for bot ${this.bot.id}`);
        try {
            // Get open orders from exchange
            const openOrders = await this.exchange.getOpenOrders(this.bot.symbol);
            // Filter orders belonging to this bot
            const botOrders = openOrders.filter(order => order.clientOrderId?.startsWith(`GB_${this.bot.id}_`));
            // Update local state
            botOrders.forEach(order => {
                this.activeOrders.set(order.clientOrderId, order);
            });
            shared_1.logger.info(`Reconciled ${botOrders.length} orders for bot ${this.bot.id}`);
        }
        catch (error) {
            shared_1.logger.error(`Failed to reconcile orders for bot ${this.bot.id}`, error);
        }
    }
    async placeInitialOrders() {
        shared_1.logger.info(`Placing initial orders for bot ${this.bot.id}`);
        // Get current price
        const ticker = await this.exchange.getTicker(this.bot.symbol);
        if (!ticker) {
            throw new Error(`Could not get ticker for ${this.bot.symbol}`);
        }
        const currentPrice = new decimal_js_1.default(ticker.lastPrice);
        // Place buy orders below current price
        for (const [index, level] of this.gridLevels.entries()) {
            if (level.side !== 'BUY')
                continue;
            const levelPrice = new decimal_js_1.default(level.price);
            if (levelPrice.greaterThanOrEqualTo(currentPrice))
                continue;
            // Check if order already exists
            const clientId = (0, shared_1.generateClientOrderId)(this.bot.id, 'BUY', index);
            if (this.activeOrders.has(clientId)) {
                continue;
            }
            // Calculate quantity
            const quantity = this.calculateOrderQuantity(levelPrice, 'BUY');
            if (quantity.lessThanOrEqualTo(0)) {
                shared_1.logger.warn(`Invalid quantity for buy order at level ${index}`);
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
                await db_1.prisma.order.create({
                    data: {
                        id: order.orderId,
                        botId: this.bot.id,
                        clientId,
                        symbol: this.bot.symbol,
                        side: 'BUY',
                        type: 'LIMIT',
                        price: levelPrice.toString(),
                        quantity: quantity.toString(),
                        status: shared_1.OrderStatus.NEW,
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
                shared_1.logger.info(`Placed buy order at level ${index}: ${quantity} @ ${levelPrice}`);
            }
            catch (error) {
                shared_1.logger.error(`Failed to place buy order at level ${index}`, error);
            }
        }
        // Place sell orders above current price
        for (const [index, level] of this.gridLevels.entries()) {
            if (level.side !== 'SELL')
                continue;
            const levelPrice = new decimal_js_1.default(level.price);
            if (levelPrice.lessThanOrEqualTo(currentPrice))
                continue;
            // Check if order already exists
            const clientId = (0, shared_1.generateClientOrderId)(this.bot.id, 'SELL', index);
            if (this.activeOrders.has(clientId)) {
                continue;
            }
            // Calculate quantity
            const quantity = this.calculateOrderQuantity(levelPrice, 'SELL');
            if (quantity.lessThanOrEqualTo(0)) {
                shared_1.logger.warn(`Invalid quantity for sell order at level ${index}`);
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
                await db_1.prisma.order.create({
                    data: {
                        id: order.orderId,
                        botId: this.bot.id,
                        clientId,
                        symbol: this.bot.symbol,
                        side: 'SELL',
                        type: 'LIMIT',
                        price: levelPrice.toString(),
                        quantity: quantity.toString(),
                        status: shared_1.OrderStatus.NEW,
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
                shared_1.logger.info(`Placed sell order at level ${index}: ${quantity} @ ${levelPrice}`);
            }
            catch (error) {
                shared_1.logger.error(`Failed to place sell order at level ${index}`, error);
            }
        }
    }
    calculateOrderQuantity(price, side) {
        // Simplified quantity calculation
        // In production, this would consider:
        // - Available balance
        // - Quote/base per grid
        // - Minimum order size
        // - Precision rounding
        const totalInvestment = new decimal_js_1.default(this.gridConfig.totalInvestmentQuote?.toString() || '1000');
        const gridCount = new decimal_js_1.default(this.gridConfig.gridCount);
        const quotePerGrid = totalInvestment.dividedBy(gridCount);
        if (side === 'BUY') {
            return quotePerGrid.dividedBy(price);
        }
        else {
            // For sell orders, use base amount
            // This is simplified - in reality would track filled buy orders
            return quotePerGrid.dividedBy(price);
        }
    }
    startReconciliationLoop() {
        const intervalMs = parseInt(process.env.REST_POLL_INTERVAL_MS || '5000');
        this.reconciliationInterval = setInterval(async () => {
            try {
                await this.reconcileOrders();
            }
            catch (error) {
                shared_1.logger.error(`Reconciliation failed for bot ${this.bot.id}`, error);
            }
        }, intervalMs);
    }
    async updateStatus(status) {
        this.status = status;
        await db_1.prisma.bot.update({
            where: { id: this.bot.id },
            data: { status },
        });
    }
}
exports.BotEngine = BotEngine;
//# sourceMappingURL=bot-engine.js.map