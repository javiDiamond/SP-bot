/**
 * BullMQ queue producers — the API side of the API↔worker spine.
 */

import { Queue } from 'bullmq';
import {
  BacktestJob,
  BotCommandJob,
  MarketDataSyncJob,
  PnlSnapshotJob,
  QUEUE_NAMES,
  ReconciliationJob,
} from '@wallex/shared';
import { config } from '../config.js';

const queues = new Map<string, Queue>();

function getQueue(name: string): Queue {
  let queue = queues.get(name);
  if (!queue) {
    queue = new Queue(name, {
      connection: { url: config.redisUrl },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 1000,
      },
    });
    queues.set(name, queue);
  }
  return queue;
}

export async function enqueueBotCommand(job: BotCommandJob): Promise<void> {
  await getQueue(QUEUE_NAMES.botCommands).add('bot-command', job, {
    jobId: `${job.type}-${job.botId}-${job.ts}`,
  });
}

export async function enqueueBacktestJob(job: BacktestJob): Promise<void> {
  const id = job.backtestId || job.optimizationId || String(Date.now());
  await getQueue(QUEUE_NAMES.backtests).add('backtest-job', job, {
    jobId: `${job.type}-${id}`,
  });
}

export async function enqueueReconciliation(job: ReconciliationJob): Promise<void> {
  await getQueue(QUEUE_NAMES.reconciliation).add('reconciliation-job', job);
}

export async function enqueueMarketDataSync(job: MarketDataSyncJob): Promise<void> {
  await getQueue(QUEUE_NAMES.marketDataSync).add('market-data-sync-job', job);
}

export async function enqueuePnlSnapshot(job: PnlSnapshotJob): Promise<void> {
  await getQueue(QUEUE_NAMES.pnlSnapshots).add('pnl-snapshot-job', job);
}

export async function closeQueues(): Promise<void> {
  for (const queue of queues.values()) {
    await queue.close();
  }
  queues.clear();
}
