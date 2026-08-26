/**
 * Markets routes — fetch/cache Wallex spot markets, candle ingestion trigger
 */

import { FastifyPluginAsync } from 'fastify';
import { WallexRestClient } from '@wallex/exchange';
import { tryParseWallexMarket } from '@wallex/shared';
import getPrismaClient from '../lib/database.js';
import { config } from '../config.js';
import { authenticate } from '../middleware/auth.js';
import { enqueueMarketDataSync } from '../lib/queue.js';

const restClient = new WallexRestClient({
  baseUrl: config.wallexApiBaseUrl,
  apiKeyHeader: config.wallexApiKeyHeader,
});

const marketsRoutes: FastifyPluginAsync = async fastify => {
  const prisma = getPrismaClient();

  fastify.addHook('preHandler', authenticate);

  /**
   * GET /api/v1/markets
   * Live spot markets from Wallex (cached into Market table)
   */
  fastify.get('/', async (request, reply) => {
    try {
      const query = request.query as { cache?: string; refresh?: string };
      const forceRefresh = query.refresh === 'true';

      if (!forceRefresh) {
        const cached = await prisma.market.findMany({ where: { isActive: true } });
        if (cached.length > 0 && query.cache !== 'false') {
          return { success: true, data: cached, source: 'db' };
        }
      }

      const markets = await restClient.getSpotMarkets();
      const parsed = markets
        .map(m => tryParseWallexMarket(m))
        .filter((m): m is NonNullable<typeof m> => m !== null);

      // Cache into DB (best effort)
      for (const m of parsed) {
        try {
          await prisma.market.upsert({
            where: { symbol: m.symbol },
            update: {
              baseAsset: m.baseAsset,
              quoteAsset: m.quoteAsset,
              isSpot: m.isSpot,
              isTmnBased: m.quoteAsset === 'TMN',
              isUsdtBased: m.quoteAsset === 'USDT',
              amountPrecision: m.amountPrecision,
              pricePrecision: m.pricePrecision,
              minNotional: m.minNotional,
              isActive: true,
              lastPrice: m.lastPrice,
              volume24h: m.volume24h,
            },
            create: {
              symbol: m.symbol,
              baseAsset: m.baseAsset,
              quoteAsset: m.quoteAsset,
              isSpot: m.isSpot,
              isTmnBased: m.quoteAsset === 'TMN',
              isUsdtBased: m.quoteAsset === 'USDT',
              amountPrecision: m.amountPrecision,
              pricePrecision: m.pricePrecision,
              minNotional: m.minNotional,
              isActive: true,
              lastPrice: m.lastPrice,
              volume24h: m.volume24h,
            },
          });
        } catch (err) {
          fastify.log.warn({ symbol: m.symbol, err }, 'Failed to cache market');
        }
      }

      return { success: true, data: parsed, source: 'exchange' };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch markets');
      // Fall back to DB cache on exchange failure
      const cached = await prisma.market.findMany({ where: { isActive: true } });
      if (cached.length > 0) {
        return { success: true, data: cached, source: 'db', degraded: true };
      }
      return reply.code(502).send({
        success: false,
        error: error.message || 'Failed to fetch markets',
      });
    }
  });

  /**
   * GET /api/v1/markets/:symbol/ticker
   */
  fastify.get('/:symbol/ticker', async (request, reply) => {
    try {
      const { symbol } = request.params as { symbol: string };
      const depth = await restClient.getDepth(symbol);
      const bestBid = depth.bid?.[0]?.price;
      const bestAsk = depth.ask?.[0]?.price;
      const lastPrice =
        bestBid && bestAsk ? String((Number(bestBid) + Number(bestAsk)) / 2) : bestBid || bestAsk;
      return { success: true, data: { symbol, lastPrice, bestBid, bestAsk } };
    } catch (error: any) {
      return reply.code(502).send({ success: false, error: error.message || 'Ticker fetch failed' });
    }
  });

  /**
   * POST /api/v1/markets/:symbol/candles
   * Enqueue candle ingestion for backtesting
   */
  fastify.post('/:symbol/candles', async (request, reply) => {
    try {
      const { symbol } = request.params as { symbol: string };
      const body = request.body as { resolution?: string; from?: number; to?: number };
      if (!body?.resolution || !body?.from || !body?.to) {
        return reply.code(400).send({
          success: false,
          error: 'resolution (string), from and to (epoch seconds) are required',
        });
      }

      await enqueueMarketDataSync({
        type: 'INGEST_CANDLES',
        symbol,
        resolution: body.resolution,
        from: body.from,
        to: body.to,
      });

      return { success: true, data: { queued: true, symbol, resolution: body.resolution } };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to enqueue candle ingestion');
      return reply.code(500).send({ success: false, error: error.message || 'Failed to enqueue' });
    }
  });

  /**
   * GET /api/v1/markets/:symbol/candles
   * Read ingested candles from DB
   */
  fastify.get('/:symbol/candles', async (request, reply) => {
    try {
      const { symbol } = request.params as { symbol: string };
      const query = request.query as { resolution?: string; from?: string; to?: string; limit?: string };

      const market = await prisma.market.findUnique({ where: { symbol } });
      if (!market) {
        return reply.code(404).send({ success: false, error: 'Market not found (fetch markets first)' });
      }

      const candles = await prisma.candle.findMany({
        where: {
          marketId: market.id,
          ...(query.resolution ? { resolution: query.resolution } : {}),
          ...(query.from || query.to
            ? {
                timestamp: {
                  ...(query.from ? { gte: new Date(Number(query.from) * 1000) } : {}),
                  ...(query.to ? { lte: new Date(Number(query.to) * 1000) } : {}),
                },
              }
            : {}),
        },
        orderBy: { timestamp: 'asc' },
        take: Math.min(Number(query.limit || 1000), 10000),
      });

      return { success: true, data: candles };
    } catch (error: any) {
      return reply.code(500).send({ success: false, error: error.message || 'Failed to fetch candles' });
    }
  });
};

export default marketsRoutes;
