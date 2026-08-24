import { z } from 'zod';
import { GridType, TradingMode } from './types';

export const GridConfigSchema = z.object({
  gridType: z.nativeEnum(GridType),
  lowerPrice: z.string().regex(/^\d+(\.\d+)?$/),
  upperPrice: z.string().regex(/^\d+(\.\d+)?$/),
  gridCount: z.number().int().min(2).max(100),
  totalInvestmentQuote: z.string().optional(),
  quotePerGrid: z.string().optional(),
  basePerGrid: z.string().optional(),
  inventoryMode: z.enum(['EXISTING_ONLY', 'AUTO_REBALANCE', 'MANUAL']),
  makerOnly: z.boolean().default(true),
  minProfitAfterFeesBps: z.number().int().min(0).default(10),
  onRangeExit: z.enum([
    'PAUSE_KEEP_ORDERS',
    'PAUSE_CANCEL_ALL',
    'STOP_CANCEL_ALL',
    'RECENTER',
    'TRAILING',
  ]).default('PAUSE_KEEP_ORDERS'),
  autoRecenter: z.boolean().default(false),
  recenterThresholdPercent: z.number().optional(),
  recenterCooldownMinutes: z.number().optional(),
  stopLossPrice: z.string().optional(),
  takeProfitPrice: z.string().optional(),
  maxOpenOrders: z.number().int().min(1).optional(),
  maxQuoteExposure: z.string().optional(),
  maxBaseExposure: z.string().optional(),
  dailyLossLimitPercent: z.number().optional(),
  allowMarketOrders: z.boolean().default(false),
});

export const CreateBotSchema = z.object({
  name: z.string().min(1).max(100),
  symbol: z.string().min(1),
  strategyType: z.literal('GRID').default('GRID'),
  mode: z.nativeEnum(TradingMode).default(TradingMode.DRY_RUN),
  exchangeAccountId: z.string().uuid().optional(),
  gridConfig: GridConfigSchema,
  maxQuoteExposure: z.string().optional(),
  maxBaseExposure: z.string().optional(),
  dailyLossLimitPercent: z.number().optional(),
});

export const UpdateBotSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  gridConfig: GridConfigSchema.optional(),
  maxQuoteExposure: z.string().optional(),
  maxBaseExposure: z.string().optional(),
  dailyLossLimitPercent: z.number().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const CreateBacktestSchema = z.object({
  name: z.string().min(1).max(100),
  symbol: z.string().min(1),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  resolution: z.string(),
  config: GridConfigSchema,
  initialBalances: z.record(z.string()).optional(),
  feeOverrides: z.object({
    makerFeeRate: z.string().optional(),
    takerFeeRate: z.string().optional(),
  }).optional(),
});

export type GridConfigInput = z.infer<typeof GridConfigSchema>;
export type CreateBotInput = z.infer<typeof CreateBotSchema>;
export type UpdateBotInput = z.infer<typeof UpdateBotSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type CreateBacktestInput = z.infer<typeof CreateBacktestSchema>;
