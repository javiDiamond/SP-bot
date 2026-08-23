/**
 * Shared types, constants, and utilities for Wallex Grid Bot
 */

import Decimal from 'decimal.js';
import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

export const TRADING_MODES = {
  DRY_RUN: 'DRY_RUN',
  LIVE: 'LIVE',
} as const;

export type TradingMode = keyof typeof TRADING_MODES;

export const GRID_TYPES = {
  ARITHMETIC: 'ARITHMETIC',
  GEOMETRIC: 'GEOMETRIC',
} as const;

export type GridType = keyof typeof GRID_TYPES;

export const BOT_STATUSES = {
  DRAFT: 'DRAFT',
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  PAUSING: 'PAUSING',
  PAUSED: 'PAUSED',
  STOPPING: 'STOPPING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR',
  RANGE_EXITED: 'RANGE_EXITED',
  KILLED: 'KILLED',
} as const;

export type BotStatus = keyof typeof BOT_STATUSES;

export const ORDER_SIDES = {
  BUY: 'BUY',
  SELL: 'SELL',
} as const;

export type OrderSide = keyof typeof ORDER_SIDES;

export const ORDER_TYPES = {
  LIMIT: 'LIMIT',
  MARKET: 'MARKET',
  STOP_LIMIT: 'STOP_LIMIT',
  STOP_MARKET: 'STOP_MARKET',
} as const;

export type OrderType = keyof typeof ORDER_TYPES;

export const ORDER_STATUSES = {
  PENDING: 'PENDING',
  NEW: 'NEW',
  PARTIALLY_FILLED: 'PARTIALLY_FILLED',
  FILLED: 'FILLED',
  CANCELED: 'CANCELED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  UNKNOWN: 'UNKNOWN',
} as const;

export type OrderStatus = keyof typeof ORDER_STATUSES;

export const GRID_LEVEL_STATUSES = {
  IDLE: 'IDLE',
  BUY_ORDER_OPEN: 'BUY_ORDER_OPEN',
  BUY_PARTIALLY_FILLED: 'BUY_PARTIALLY_FILLED',
  BUY_FILLED: 'BUY_FILLED',
  SELL_ORDER_OPEN: 'SELL_ORDER_OPEN',
  SELL_PARTIALLY_FILLED: 'SELL_PARTIALLY_FILLED',
  SELL_FILLED: 'SELL_FILLED',
  ERROR: 'ERROR',
} as const;

export type GridLevelStatus = keyof typeof GRID_LEVEL_STATUSES;

export const INVENTORY_MODES = {
  EXISTING_ONLY: 'EXISTING_ONLY',
  AUTO_REBALANCE: 'AUTO_REBALANCE',
  MANUAL: 'MANUAL',
} as const;

export type InventoryMode = keyof typeof INVENTORY_MODES;

export const RANGE_EXIT_BEHAVIORS = {
  PAUSE_KEEP_ORDERS: 'PAUSE_KEEP_ORDERS',
  PAUSE_CANCEL_ALL: 'PAUSE_CANCEL_ALL',
  STOP_CANCEL_ALL: 'STOP_CANCEL_ALL',
  RECENTER: 'RECENTER',
  TRAILING: 'TRAILING',
} as const;

export type RangeExitBehavior = keyof typeof RANGE_EXIT_BEHAVIORS;

// ============================================================================
// Zod Schemas
// ============================================================================

export const DecimalSchema = z.string().or(z.number()).transform((val) => new Decimal(val));

export const MarketSchema = z.object({
  symbol: z.string(),
  baseAsset: z.string(),
  quoteAsset: z.string(),
  isSpot: z.boolean(),
  isTmnBased: z.boolean(),
  isUsdtBased: z.boolean(),
  amountPrecision: z.number(),
  pricePrecision: z.number(),
  price: z.string(),
  volume24h: z.string().optional(),
  minNotional: z.string().optional(),
});

export type Market = z.infer<typeof MarketSchema>;

export const GridConfigSchema = z.object({
  name: z.string().min(1).max(50),
  symbol: z.string(),
  strategyType: z.literal('GRID'),
  mode: z.nativeEnum(TRADING_MODES),
  gridType: z.nativeEnum(GRID_TYPES),
  lowerPrice: DecimalSchema,
  upperPrice: DecimalSchema,
  gridCount: z.number().int().min(2),
  totalInvestmentQuote: DecimalSchema.optional(),
  quotePerGrid: DecimalSchema.optional(),
  basePerGrid: DecimalSchema.optional(),
  inventoryMode: z.nativeEnum(INVENTORY_MODES).default(INVENTORY_MODES.EXISTING_ONLY),
  makerOnly: z.boolean().default(true),
  minProfitAfterFeesBps: z.number().int().min(0).default(10),
  onRangeExit: z.nativeEnum(RANGE_EXIT_BEHAVIORS).default(RANGE_EXIT_BEHAVIORS.PAUSE_KEEP_ORDERS),
  autoRecenter: z.boolean().default(false),
  recenterThresholdPercent: z.number().positive().optional(),
  recenterCooldownMinutes: z.number().positive().optional(),
  stopLossPrice: DecimalSchema.optional(),
  takeProfitPrice: DecimalSchema.optional(),
  maxOpenOrders: z.number().int().positive().optional(),
  maxQuoteExposure: DecimalSchema.optional(),
  maxBaseExposure: DecimalSchema.optional(),
  dailyLossLimitPercent: z.number().positive().optional(),
  allowMarketOrders: z.boolean().default(false),
  enabled: z.boolean().default(true),
});

export type GridConfig = z.infer<typeof GridConfigSchema>;

// ============================================================================
// Decimal Utilities
// ============================================================================

/**
 * Set decimal precision safely
 */
export function setDecimalPrecision(value: Decimal.Value, precision: number): string {
  const dec = new Decimal(value);
  return dec.toFixed(precision);
}

/**
 * Round to market precision
 */
export function roundToPrecision(value: Decimal.Value, precision: number): string {
  const dec = new Decimal(value);
  const factor = new Decimal(10).pow(precision);
  return dec.times(factor).toNearest(1).div(factor).toString();
}

/**
 * Calculate grid levels for arithmetic grid
 */
export function calculateArithmeticGridLevels(
  lowerPrice: Decimal.Value,
  upperPrice: Decimal.Value,
  gridCount: number,
  pricePrecision: number
): string[] {
  const lower = new Decimal(lowerPrice);
  const upper = new Decimal(upperPrice);
  const step = upper.minus(lower).div(gridCount);
  
  const levels: string[] = [];
  for (let i = 0; i <= gridCount; i++) {
    const level = lower.plus(step.times(i));
    levels.push(roundToPrecision(level, pricePrecision));
  }
  
  return levels;
}

/**
 * Calculate grid levels for geometric grid
 */
export function calculateGeometricGridLevels(
  lowerPrice: Decimal.Value,
  upperPrice: Decimal.Value,
  gridCount: number,
  pricePrecision: number
): string[] {
  const lower = new Decimal(lowerPrice);
  const upper = new Decimal(upperPrice);
  const ratio = upper.div(lower).pow(1 / gridCount);
  
  const levels: string[] = [];
  for (let i = 0; i <= gridCount; i++) {
    const level = lower.times(ratio.pow(i));
    levels.push(roundToPrecision(level, pricePrecision));
  }
  
  return levels;
}

/**
 * Calculate grid levels based on grid type
 */
export function calculateGridLevels(
  gridType: GridType,
  lowerPrice: Decimal.Value,
  upperPrice: Decimal.Value,
  gridCount: number,
  pricePrecision: number
): string[] {
  if (gridType === GRID_TYPES.ARITHMETIC) {
    return calculateArithmeticGridLevels(lowerPrice, upperPrice, gridCount, pricePrecision);
  } else {
    return calculateGeometricGridLevels(lowerPrice, upperPrice, gridCount, pricePrecision);
  }
}

/**
 * Validate minimum profit after fees
 */
export function validateMinProfitAfterFees(
  buyPrice: Decimal.Value,
  sellPrice: Decimal.Value,
  makerFeeRate: Decimal.Value,
  takerFeeRate: Decimal.Value,
  minProfitBps: number
): { valid: boolean; expectedProfitBps: number; requiredProfitBps: number } {
  const buy = new Decimal(buyPrice);
  const sell = new Decimal(sellPrice);
  const makerFee = new Decimal(makerFeeRate);
  const takerFee = new Decimal(takerFeeRate);
  
  const spread = sell.minus(buy).div(buy);
  const totalFees = makerFee.plus(takerFee);
  const minProfit = new Decimal(minProfitBps).div(10000);
  
  const expectedProfitBps = spread.minus(totalFees).times(10000).toNumber();
  const requiredProfitBps = minProfitBps;
  
  return {
    valid: spread.gte(totalFees.plus(minProfit)),
    expectedProfitBps,
    requiredProfitBps,
  };
}

/**
 * Generate unique client order ID
 */
export function generateClientOrderId(
  botId: string,
  side: OrderSide,
  levelIndex: number,
  suffix?: string
): string {
  const randomSuffix = suffix || Math.random().toString(36).substring(2, 8).toUpperCase();
  const sideCode = side === ORDER_SIDES.BUY ? 'B' : 'S';
  return `GB_${botId}_${sideCode}_L${levelIndex}_${randomSuffix}`.substring(0, 32);
}

/**
 * Parse Wallex market response
 */
export function parseWallexMarket(raw: any): Market {
  return {
    symbol: raw.symbol,
    baseAsset: raw.base_asset,
    quoteAsset: raw.quote_asset,
    isSpot: raw.is_spot === true,
    isTmnBased: raw.is_tmn_based === true,
    isUsdtBased: raw.is_usdt_based === true,
    amountPrecision: raw.amount_precision ?? 8,
    pricePrecision: raw.price_precision ?? 8,
    price: String(raw.price ?? '0'),
    volume24h: String(raw.volume_24h ?? '0'),
    minNotional: undefined,
  };
}

/**
 * Parse Wallex candle response
 */
export function parseWallexCandles(raw: any): Array<{
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}> {
  if (!raw || raw.s !== 'ok') {
    return [];
  }
  
  const count = raw.t?.length || 0;
  const candles = [];
  
  for (let i = 0; i < count; i++) {
    candles.push({
      timestamp: raw.t[i],
      open: String(raw.o?.[i] ?? '0'),
      high: String(raw.h?.[i] ?? '0'),
      low: String(raw.l?.[i] ?? '0'),
      close: String(raw.c?.[i] ?? '0'),
      volume: String(raw.v?.[i] ?? '0'),
    });
  }
  
  return candles;
}

// ============================================================================
// Export all
// ============================================================================

export default {
  TRADING_MODES,
  GRID_TYPES,
  BOT_STATUSES,
  ORDER_SIDES,
  ORDER_TYPES,
  ORDER_STATUSES,
  GRID_LEVEL_STATUSES,
  INVENTORY_MODES,
  RANGE_EXIT_BEHAVIORS,
  DecimalSchema,
  MarketSchema,
  GridConfigSchema,
  setDecimalPrecision,
  roundToPrecision,
  calculateArithmeticGridLevels,
  calculateGeometricGridLevels,
  calculateGridLevels,
  validateMinProfitAfterFees,
  generateClientOrderId,
  parseWallexMarket,
  parseWallexCandles,
};
