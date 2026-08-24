"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketDataService = void 0;
const shared_1 = require("@wallex/shared");
const exchange_1 = require("@wallex/exchange");
const db_1 = require("@wallex/db");
class MarketDataService {
    exchange;
    marketDataInterval;
    subscribedSymbols = new Set();
    constructor() {
        this.exchange = new exchange_1.WallexExchange({
            mode: 'DRY_RUN',
        });
    }
    async start() {
        // Sync market data every 5 seconds for active symbols
        const intervalMs = 5000;
        this.marketDataInterval = setInterval(async () => {
            try {
                for (const symbol of this.subscribedSymbols) {
                    await this.syncMarketData(symbol);
                }
            }
            catch (error) {
                shared_1.logger.error('Market data service error', error);
            }
        }, intervalMs);
        shared_1.logger.info('Market data service started');
    }
    async stop() {
        if (this.marketDataInterval) {
            clearInterval(this.marketDataInterval);
        }
        shared_1.logger.info('Market data service stopped');
    }
    async subscribe(symbol) {
        this.subscribedSymbols.add(symbol);
        shared_1.logger.info(`Subscribed to market data for ${symbol}`);
        // Initial sync
        await this.syncMarketData(symbol);
    }
    async unsubscribe(symbol) {
        this.subscribedSymbols.delete(symbol);
        shared_1.logger.info(`Unsubscribed from market data for ${symbol}`);
    }
    async syncMarketData(symbol) {
        try {
            // Get market info
            const markets = await this.exchange.getMarkets();
            const market = markets.find(m => m.symbol === symbol);
            if (!market) {
                shared_1.logger.warn(`Market ${symbol} not found`);
                return;
            }
            // Get ticker
            const ticker = await this.exchange.getTicker(symbol);
            if (ticker) {
                // Store in database or cache
                await this.storeMarketData(symbol, market, ticker);
            }
        }
        catch (error) {
            shared_1.logger.error(`Failed to sync market data for ${symbol}`, error);
            throw error;
        }
    }
    async storeMarketData(symbol, market, ticker) {
        // Store market data in database
        await db_1.prisma.market.upsert({
            where: { symbol },
            data: {
                symbol,
                baseAsset: market.baseAsset,
                quoteAsset: market.quoteAsset,
                isSpot: market.isSpot,
                pricePrecision: market.pricePrecision,
                amountPrecision: market.amountPrecision,
                lastPrice: ticker.lastPrice,
                volume24h: ticker.volume24h,
                updatedAt: new Date(),
            },
        });
    }
}
exports.MarketDataService = MarketDataService;
//# sourceMappingURL=market-data.js.map