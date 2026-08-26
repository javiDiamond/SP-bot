/**
 * Market data sync service — SYNC_MARKETS and INGEST_CANDLES processors
 * (Phase 4.1: candle ingestion for backtesting).
 *
 * Candles are fetched from the Wallex UDF endpoint and paginated in time
 * chunks, then upserted into the Candle table (@@unique
 * (marketId, timestamp, resolution) makes upserts idempotent).
 */

import { prisma } from '@wallex/db';
import { WallexRestClient, WallexCandleResponse } from '@wallex/exchange';
import { logger, tryParseWallexMarket } from '@wallex/shared';
import { workerConfig } from '../config';

const RESOLUTION_SECONDS: Record<string, number> = {
  '1m': 60,
  '3m': 180,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '2h': 7200,
  '4h': 14400,
  '6h': 21600,
  '12h': 43200,
  '1d': 86400,
  D: 86400,
  '1D': 86400,
  '1W': 604800,
};

/** Max candles requested per UDF call (Wallex caps responses). */
const CANDLES_PER_REQUEST = 500;

export function resolutionToSeconds(resolution: string): number | undefined {
  if (RESOLUTION_SECONDS[resolution]) return RESOLUTION_SECONDS[resolution];
  // UDF numeric resolutions are minutes (e.g. "60")
  const n = Number(resolution);
  if (Number.isFinite(n) && n > 0) return n * 60;
  return undefined;
}

export class MarketDataSyncService {
  private restClient: WallexRestClient;

  constructor() {
    this.restClient = new WallexRestClient({
      baseUrl: workerConfig.wallexApiBaseUrl,
      apiKeyHeader: workerConfig.wallexApiKeyHeader,
    });
  }

  get client(): WallexRestClient {
    return this.restClient;
  }

  /** Upsert all spot markets into the Market table. */
  async syncMarkets(): Promise<number> {
    const markets = await this.restClient.getSpotMarkets();
    let upserted = 0;

    for (const m of markets) {
      const parsed = tryParseWallexMarket({
        symbol: m.symbol,
        base_asset: m.base_asset,
        quote_asset: m.quote_asset,
        is_spot: m.is_spot,
        price_precision: m.price_precision,
        amount_precision: m.amount_precision,
        last_price: m.price,
        volume_24h: m.volume_24h,
      });
      if (!parsed) continue;

      try {
        await prisma.market.upsert({
          where: { symbol: parsed.symbol },
          update: {
            baseAsset: parsed.baseAsset,
            quoteAsset: parsed.quoteAsset,
            isSpot: parsed.isSpot,
            isTmnBased: parsed.quoteAsset === 'TMN',
            isUsdtBased: parsed.quoteAsset === 'USDT',
            amountPrecision: parsed.amountPrecision,
            pricePrecision: parsed.pricePrecision,
            minNotional: parsed.minNotional,
            isActive: true,
            lastPrice: parsed.lastPrice,
            volume24h: parsed.volume24h,
          },
          create: {
            symbol: parsed.symbol,
            baseAsset: parsed.baseAsset,
            quoteAsset: parsed.quoteAsset,
            isSpot: parsed.isSpot,
            isTmnBased: parsed.quoteAsset === 'TMN',
            isUsdtBased: parsed.quoteAsset === 'USDT',
            amountPrecision: parsed.amountPrecision,
            pricePrecision: parsed.pricePrecision,
            minNotional: parsed.minNotional,
            isActive: true,
            lastPrice: parsed.lastPrice,
            volume24h: parsed.volume24h,
          },
        });
        upserted += 1;
      } catch (err) {
        logger.warn(`Failed to upsert market ${parsed.symbol}: ${String((err as Error)?.message || err)}`);
      }
    }

    logger.info(`Market sync complete: ${upserted}/${markets.length} markets`);
    return upserted;
  }

  /**
   * Ensure the Market row exists (fetch from exchange if missing).
   * Returns the marketId or undefined.
   */
  async ensureMarket(symbol: string): Promise<{ id: string; symbol: string } | undefined> {
    const existing = await prisma.market.findUnique({ where: { symbol } });
    if (existing) return existing;

    try {
      const wire = await this.restClient.getMarket(symbol);
      if (!wire) return undefined;
      const parsed = tryParseWallexMarket({
        symbol: wire.symbol,
        base_asset: wire.base_asset,
        quote_asset: wire.quote_asset,
        is_spot: wire.is_spot,
        price_precision: wire.price_precision,
        amount_precision: wire.amount_precision,
        last_price: wire.price,
        volume_24h: wire.volume_24h,
      });
      if (!parsed) return undefined;
      const created = await prisma.market.create({
        data: {
          symbol: parsed.symbol,
          baseAsset: parsed.baseAsset,
          quoteAsset: parsed.quoteAsset,
          isSpot: parsed.isSpot,
          isTmnBased: parsed.quoteAsset === 'TMN',
          isUsdtBased: parsed.quoteAsset === 'USDT',
          amountPrecision: parsed.amountPrecision,
          pricePrecision: parsed.pricePrecision,
          minNotional: parsed.minNotional,
          lastPrice: parsed.lastPrice,
          volume24h: parsed.volume24h,
        },
      });
      return created;
    } catch (err) {
      logger.warn(`Failed to ensure market ${symbol}: ${String((err as Error)?.message || err)}`);
      return undefined;
    }
  }

  /**
   * Ingest candles for [from, to] (epoch SECONDS) into the Candle table.
   * Returns the number of rows upserted.
   */
  async ingestCandles(params: {
    symbol: string;
    resolution: string;
    from: number; // epoch seconds
    to: number; // epoch seconds
  }): Promise<number> {
    const { symbol, resolution } = params;
    const market = await this.ensureMarket(symbol.toUpperCase());
    if (!market) {
      throw new Error(`Cannot ingest candles: market ${symbol} not found`);
    }

    const resSeconds = resolutionToSeconds(resolution);
    if (!resSeconds) {
      throw new Error(`Unsupported candle resolution: ${resolution}`);
    }

    const chunkSeconds = resSeconds * CANDLES_PER_REQUEST;
    let from = Math.floor(params.from);
    const to = Math.floor(params.to);
    if (to <= from) throw new Error('Invalid candle range: to <= from');

    let upserted = 0;
    let requests = 0;

    while (from < to && requests < 200) {
      const chunkTo = Math.min(from + chunkSeconds, to);
      requests += 1;

      let response: WallexCandleResponse;
      try {
        response = await this.restClient.getCandles({
          symbol,
          resolution,
          from,
          to: chunkTo,
        });
      } catch (err) {
        logger.warn(`Candle fetch failed (${symbol} ${resolution} ${from}-${chunkTo}): ${String((err as Error)?.message || err)}`);
        from = chunkTo;
        continue;
      }

      const rows = this.parseUdfResponse(response);
      if (rows.length > 0) {
        upserted += await this.upsertCandles(market.id, resolution, rows);
      }

      // Advance past this chunk; UDF `to` is exclusive-ish, step by chunk.
      from = chunkTo;

      // No more data than available — stop early if the response ended before chunkTo
      const lastTs = response.t?.length ? response.t[response.t.length - 1] : undefined;
      if (lastTs !== undefined && lastTs < chunkTo - resSeconds && rows.length < CANDLES_PER_REQUEST / 2) {
        // Sparse tail; keep going only if we are far from the end
        if (chunkTo >= to) break;
      }
    }

    logger.info(`Candle ingestion complete: ${symbol} ${resolution} → ${upserted} rows`);
    return upserted;
  }

  /** Parse the UDF columnar response { s, t[], o[], h[], l[], c[], v[] }. */
  private parseUdfResponse(
    r: WallexCandleResponse,
  ): Array<{ timestamp: number; open: string; high: string; low: string; close: string; volume: string }> {
    const out: Array<{ timestamp: number; open: string; high: string; low: string; close: string; volume: string }> = [];
    if (!r || !Array.isArray(r.t)) return out;

    for (let i = 0; i < r.t.length; i++) {
      const open = r.o?.[i];
      const high = r.h?.[i];
      const low = r.l?.[i];
      const close = r.c?.[i];
      if (open === undefined || high === undefined || low === undefined || close === undefined) continue;
      out.push({
        // UDF timestamps are epoch seconds; store as DateTime (ms)
        timestamp: r.t[i] * 1000,
        open: String(open),
        high: String(high),
        low: String(low),
        close: String(close),
        volume: String(r.v?.[i] ?? '0'),
      });
    }
    return out;
  }

  private async upsertCandles(
    marketId: string,
    resolution: string,
    rows: Array<{ timestamp: number; open: string; high: string; low: string; close: string; volume: string }>,
  ): Promise<number> {
    if (rows.length === 0) return 0;
    try {
      const result = await prisma.candle.createMany({
        data: rows.map(row => ({
          marketId,
          timestamp: new Date(row.timestamp),
          resolution,
          open: row.open,
          high: row.high,
          low: row.low,
          close: row.close,
          volume: row.volume,
        })),
        skipDuplicates: true,
      });
      return result.count;
    } catch (err) {
      logger.warn(`Candle upsert failed: ${String((err as Error)?.message || err)}`);
      return 0;
    }
  }
}
