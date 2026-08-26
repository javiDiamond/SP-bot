import { z } from 'zod';

// Queue names (keep in sync between API producers and worker consumers)
export const QUEUE_NAMES = {
  botCommands: 'bot-commands',
  backtests: 'backtests',
  reconciliation: 'reconciliation',
  marketDataSync: 'market-data-sync',
  pnlSnapshots: 'pnl-snapshots',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Redis pub/sub channel for realtime dashboard events
export const REALTIME_CHANNEL = 'wallex:events';

// --- bot.commands job payloads ---
export const BotCommandTypeSchema = z.enum([
  'START',
  'PAUSE',
  'RESUME',
  'STOP',
  'CANCEL_ALL',
  'KILL_ALL',
]);
export const BotCommandJobSchema = z.object({
  type: BotCommandTypeSchema,
  botId: z.string(),
  actorUserId: z.string().optional(),
  ts: z.number().default(() => Date.now()),
});
export type BotCommandJob = z.infer<typeof BotCommandJobSchema>;

// --- backtests job payloads ---
export const BacktestJobSchema = z.object({
  type: z.enum(['RUN_BACKTEST', 'RUN_OPTIMIZATION']),
  backtestId: z.string().optional(),
  optimizationId: z.string().optional(),
});
export type BacktestJob = z.infer<typeof BacktestJobSchema>;

// --- reconciliation job payloads ---
export const ReconciliationJobSchema = z.object({
  type: z.enum(['RECONCILE_BOT', 'RECONCILE_ALL']),
  botId: z.string().optional(),
});
export type ReconciliationJob = z.infer<typeof ReconciliationJobSchema>;

// --- market-data-sync job payloads ---
export const MarketDataSyncJobSchema = z.object({
  type: z.enum(['SYNC_MARKETS', 'INGEST_CANDLES']),
  symbol: z.string().optional(),
  resolution: z.string().optional(),
  from: z.number().optional(),
  to: z.number().optional(),
});
export type MarketDataSyncJob = z.infer<typeof MarketDataSyncJobSchema>;

// --- pnl-snapshots job payloads ---
export const PnlSnapshotJobSchema = z.object({
  type: z.enum(['SNAPSHOT_ALL', 'SNAPSHOT_BOT']),
  botId: z.string().optional(),
});
export type PnlSnapshotJob = z.infer<typeof PnlSnapshotJobSchema>;

// --- Realtime event types published on REALTIME_CHANNEL ---
export const RealtimeEventType = [
  'bot.status',
  'bot.stats',
  'order.update',
  'fill.new',
  'killswitch.changed',
  'price.stale',
  'backtest.progress',
  'reconciliation.report',
] as const;

export interface RealtimeEvent {
  channel: typeof REALTIME_CHANNEL;
  type: (typeof RealtimeEventType)[number];
  payload: unknown;
  ts: number;
}
