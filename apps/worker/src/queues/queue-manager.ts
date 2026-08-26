/**
 * BullMQ consumers — the worker side of the API↔worker queue spine (D9).
 * All job payloads are validated with the shared zod schemas so the
 * producer (API) and consumer (worker) cannot drift.
 */

import { Queue, Worker as BullWorker, Job } from 'bullmq';
import { Job as BullJob } from 'bullmq';
import Redis from 'ioredis';
import { z } from 'zod';
import {
  BacktestJobSchema,
  BotCommandJobSchema,
  MarketDataSyncJobSchema,
  PnlSnapshotJobSchema,
  QUEUE_NAMES,
  ReconciliationJobSchema,
  logger,
} from '@wallex/shared';
import { workerConfig } from '../config';

const JOB_SCHEMAS: Record<string, z.ZodTypeAny> = {
  [QUEUE_NAMES.botCommands]: BotCommandJobSchema,
  [QUEUE_NAMES.backtests]: BacktestJobSchema,
  [QUEUE_NAMES.reconciliation]: ReconciliationJobSchema,
  [QUEUE_NAMES.marketDataSync]: MarketDataSyncJobSchema,
  [QUEUE_NAMES.pnlSnapshots]: PnlSnapshotJobSchema,
};

export class QueueManager {
  private connection: Redis;
  private workers: BullWorker[] = [];

  constructor(redisUrl?: string) {
    this.connection = new Redis(redisUrl || workerConfig.redisUrl, {
      maxRetriesPerRequest: null, // required by BullMQ
    });
  }

  /**
   * Register a processor for a queue. Job data is zod-validated before the
   * processor runs; invalid jobs are dropped with an error log.
   */
  register<T>(queueName: string, processor: (data: T, job: BullJob) => Promise<unknown>): void {
    const schema = JOB_SCHEMAS[queueName];

    const worker = new BullWorker(
      queueName,
      async (job: Job) => {
        let data = job.data;
        if (schema) {
          const parsed = schema.safeParse(job.data);
          if (!parsed.success) {
            logger.error(
              `Invalid ${queueName} job payload dropped: ${JSON.stringify(parsed.error.flatten()).slice(0, 500)}`,
            );
            return;
          }
          data = parsed.data;
        }
        return processor(data as T, job);
      },
      {
        connection: this.connection,
        concurrency: queueName === QUEUE_NAMES.backtests ? 1 : 4,
      },
    );

    worker.on('failed', (job, err) => {
      logger.warn(`${queueName} job ${job?.id ?? '?'} failed: ${String(err?.message || err)}`);
    });
    worker.on('error', err => {
      logger.warn(`${queueName} worker error: ${String(err?.message || err)}`);
    });

    this.workers.push(worker);
    logger.info(`Queue processor registered: ${queueName}`);
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map(w => w.close().catch(() => undefined)));
    this.workers = [];
    try {
      await this.connection.quit();
    } catch {
      this.connection.disconnect();
    }
    logger.info('Queue manager closed');
  }
}

export { Queue };
