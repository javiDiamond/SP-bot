/**
 * Markets route - Get Wallex market data
 */

import { FastifyPluginAsync } from 'fastify';
import { WallexRestClient } from '@wallex-grid/exchange';
import { parseWallexMarket } from '@wallex/shared';
import getPrismaClient from '../lib/database.js';

const marketsRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = getPrismaClient();

  /**
   * GET /api/v1/markets
   * Get all spot markets from Wallex
   */
  fastify.get('/', async (request, reply) => {
    try {
      // Try to get cached markets from database
      const cachedMarkets = await prisma.market.findMany({
        where: { isSpot: true, isActive: true },
        orderBy: { symbol: 'asc' },
      });

      if (cachedMarkets.length > 0) {
        return {
          success: true,
          data: cachedMarkets,
          source: 'cache',
        };
      }

      // Fetch from Wallex
      const client = new WallexRestClient({
        baseUrl: process.env.WALLEX_API_BASE_URL || 'https://api.wallex.ir',
      });

      const markets = await client.getSpotMarkets();
      
      // Parse and store in database
      const parsedMarkets = markets.map(m => parseWallexMarket(m));
      
      // Upsert into database
      for (const market of parsedMarkets) {
        await prisma.market.upsert({
          where: { symbol: market.symbol },
          update: {
            lastPrice: market.price ? parseFloat(market.price) : null,
            volume24h: market.volume24h ? parseFloat(market.volume24h) : null,
            updatedAt: new Date(),
          },
          create: {
            ...market,
            minNotional: market.minNotional ? parseFloat(market.minNotional) : null,
          },
        });
      }

      return {
        success: true,
        data: parsedMarkets,
        source: 'live',
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch markets');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch markets',
      });
    }
  });

  /**
   * GET /api/v1/markets/:symbol
   * Get specific market details
   */
  fastify.get('/:symbol', async (request, reply) => {
    try {
      const { symbol } = request.params as { symbol: string };
      
      const market = await prisma.market.findUnique({
        where: { symbol },
      });

      if (!market) {
        return reply.code(404).send({
          success: false,
          error: 'Market not found',
        });
      }

      return {
        success: true,
        data: market,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to fetch market');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to fetch market',
      });
    }
  });

  /**
   * POST /api/v1/markets/sync
   * Force sync markets from Wallex
   */
  fastify.post('/sync', async (request, reply) => {
    try {
      const client = new WallexRestClient({
        baseUrl: process.env.WALLEX_API_BASE_URL || 'https://api.wallex.ir',
      });

      const markets = await client.getSpotMarkets();
      const parsedMarkets = markets.map(m => parseWallexMarket(m));

      // Update all markets
      for (const market of parsedMarkets) {
        await prisma.market.upsert({
          where: { symbol: market.symbol },
          update: {
            ...market,
            minNotional: market.minNotional ? parseFloat(market.minNotional) : null,
            updatedAt: new Date(),
          },
          create: {
            ...market,
            minNotional: market.minNotional ? parseFloat(market.minNotional) : null,
          },
        });
      }

      return {
        success: true,
        count: parsedMarkets.length,
      };
    } catch (error: any) {
      fastify.log.error(error, 'Failed to sync markets');
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to sync markets',
      });
    }
  });
};

export default marketsRoutes;
