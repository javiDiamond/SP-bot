/**
 * Realtime event publisher — Redis pub/sub on the shared REALTIME_CHANNEL.
 * The API's SSE route relays these messages to the dashboard.
 */

import Redis from 'ioredis';
import {
  REALTIME_CHANNEL,
  RealtimeEvent,
  logger,
} from '@wallex/shared';
import { workerConfig } from '../config';

export type RealtimeType = RealtimeEvent['type'];

export class RealtimePublisher {
  private connection: Redis;

  constructor(redisUrl?: string) {
    this.connection = new Redis(redisUrl || workerConfig.redisUrl, {
      maxRetriesPerRequest: 2,
      lazyConnect: false,
    });
    this.connection.on('error', err => {
      logger.warn(`Realtime publisher redis error: ${String(err?.message || err)}`);
    });
  }

  publish(type: RealtimeType, payload: unknown): void {
    const message: RealtimeEvent = {
      channel: REALTIME_CHANNEL,
      type,
      payload,
      ts: Date.now(),
    };
    this.connection.publish(REALTIME_CHANNEL, JSON.stringify(message)).catch(err => {
      logger.warn(`Failed to publish realtime event ${type}: ${String(err?.message || err)}`);
    });
  }

  async close(): Promise<void> {
    try {
      await this.connection.quit();
    } catch {
      this.connection.disconnect();
    }
  }
}
