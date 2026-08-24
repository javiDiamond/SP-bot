import { logger } from '@wallex/shared';
import { WallexExchange } from '@wallex/exchange';
import { prisma } from '@wallex/db';

export class MarketDataService {
  private exchange: WallexExchange;
  private marketDataInterval?: NodeJS.Timeout;
  private subscribedSymbols: Set<string> = new Set();

  constructor() {
    this.exchange = new WallexExchange({
      mode: 'DRY_RUN',
    });
  }

  async start(): Promise<void> {
    // Sync market data every 5 seconds for active symbols
    const intervalMs = 5000;

    this.marketDataInterval = setInterval(async () => {
      try {
        for (const symbol of this.subscribedSymbols) {
          await this.syncMarketData(symbol);
        }
      } catch (error) {
        logger.error('Market data service error', error);
      }
    }, intervalMs);

    logger.info('Market data service started');
  }

  async stop(): Promise<void> {
    if (this.marketDataInterval) {
      clearInterval(this.marketDataInterval);
    }
    logger.info('Market data service stopped');
  }

  async subscribe(symbol: string): Promise<void> {
    this.subscribedSymbols.add(symbol);
    logger.info(`Subscribed to market data for ${symbol}`);
    
    // Initial sync
    await this.syncMarketData(symbol);
  }

  async unsubscribe(symbol: string): Promise<void> {
    this.subscribedSymbols.delete(symbol);
    logger.info(`Unsubscribed from market data for ${symbol}`);
  }

  async syncMarketData(symbol: string): Promise<void> {
    try {
      // Get market info
      const markets = await this.exchange.getMarkets();
      const market = markets.find(m => m.symbol === symbol);
      
      if (!market) {
        logger.warn(`Market ${symbol} not found`);
        return;
      }

      // Get ticker
      const ticker = await this.exchange.getTicker(symbol);
      
      if (ticker) {
        // Store in database or cache
        await this.storeMarketData(symbol, market, ticker);
      }
    } catch (error) {
      logger.error(`Failed to sync market data for ${symbol}`, error);
      throw error;
    }
  }

  private async storeMarketData(
    symbol: string,
    market: any,
    ticker: any
  ): Promise<void> {
    // Store market data in database
    await prisma.market.upsert({
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
