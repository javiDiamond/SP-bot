/**
 * Redis distributed lock with value-checked release (Lua compare-and-delete)
 * and TTL renewal for lock holders.
 */

import Redis from 'ioredis';
import { workerConfig } from '../config';

const RELEASE_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;

const EXTEND_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("PEXPIRE", KEYS[1], ARGV[2])
else
  return 0
end
`;

export class RedisLock {
  private connection: Redis;

  constructor(redisUrl?: string) {
    this.connection = new Redis(redisUrl || workerConfig.redisUrl, {
      maxRetriesPerRequest: 2,
    });
  }

  /** Try to acquire `key`. Returns the lock value (ownership token) or null. */
  async acquire(key: string, ttlMs: number): Promise<string | null> {
    const value = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const result = await this.connection.set(key, value, 'PX', ttlMs, 'NX');
    return result === 'OK' ? value : null;
  }

  /** Release only if we still own the lock (Lua compare-and-delete). */
  async release(key: string, value: string): Promise<boolean> {
    const result = await this.connection.eval(RELEASE_SCRIPT, 1, key, value);
    return result === 1;
  }

  /** Renew the TTL only if we still own the lock. */
  async extend(key: string, value: string, ttlMs: number): Promise<boolean> {
    const result = await this.connection.eval(EXTEND_SCRIPT, 1, key, value, String(ttlMs));
    return result === 1;
  }

  async close(): Promise<void> {
    try {
      await this.connection.quit();
    } catch {
      this.connection.disconnect();
    }
  }
}
