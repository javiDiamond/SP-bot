import Redis from 'ioredis';

export class RedisLock {
  private connection: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.connection = new Redis(redisUrl);
  }

  async acquire(key: string, ttlMs: number): Promise<string | null> {
    const value = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Try to set key with NX (only if not exists)
    const result = await this.connection.set(key, value, 'PX', ttlMs, 'NX');
    
    if (result === 'OK') {
      return value;
    }
    
    return null;
  }

  async release(lockKey: string): Promise<void> {
    // In production, you'd verify the lock value matches before deleting
    // This is a simplified version
    await this.connection.del(lockKey);
  }

  async extend(key: string, value: string, ttlMs: number): Promise<boolean> {
    // Verify we still own the lock
    const currentValue = await this.connection.get(key);
    if (currentValue !== value) {
      return false;
    }

    const result = await this.connection.set(key, value, 'PX', ttlMs, 'XX');
    return result === 'OK';
  }

  async close(): Promise<void> {
    await this.connection.quit();
  }
}
