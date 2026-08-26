import { z } from 'zod';
import { OrderSide } from './types';
import type { MarketInfo } from './types';

// Wire shape of a Wallex market object (snake_case; strings OR numbers)
const str = () => z.union([z.string(), z.number()]).nullish();

const WallexMarketWireSchema = z.object({
  symbol: z.string(),
  base_asset: z.string(),
  quote_asset: z.string(),
  is_spot: z.boolean().or(z.string()).optional(),
  price_precision: z.number().or(z.string()).default(8),
  amount_precision: z.number().or(z.string()).default(8),
  min_notional: str(),
  price: str(),
  last_price: str(),
  volume_24h: str(),
});

function toStr(v: string | number | null | undefined): string | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  return String(v);
}

function toNumber(v: number | string): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 8;
}

function toBool(v: boolean | string | undefined): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v === 'true' || v === '1';
  return true;
}

/**
 * Parse/normalize a raw Wallex market payload into MarketInfo.
 * Throws ZodError on malformed input.
 */
export function parseWallexMarket(raw: unknown): MarketInfo {
  const m = WallexMarketWireSchema.parse(raw);
  return {
    symbol: m.symbol.toUpperCase(),
    baseAsset: m.base_asset.toUpperCase(),
    quoteAsset: m.quote_asset.toUpperCase(),
    isSpot: toBool(m.is_spot),
    pricePrecision: toNumber(m.price_precision),
    amountPrecision: toNumber(m.amount_precision),
    minNotional: toStr(m.min_notional),
    lastPrice: toStr(m.last_price) ?? toStr(m.price),
    volume24h: toStr(m.volume_24h),
  };
}

/** Safe variant returning null instead of throwing. */
export function tryParseWallexMarket(raw: unknown): MarketInfo | null {
  try {
    return parseWallexMarket(raw);
  } catch {
    return null;
  }
}

/** Derive OrderSide from Fill.isBuyer boolean (Fill has no side column). */
export function fillSideFromIsBuyer(isBuyer: boolean): OrderSide {
  return isBuyer ? OrderSide.BUY : OrderSide.SELL;
}
