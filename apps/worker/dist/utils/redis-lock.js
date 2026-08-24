"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisLock = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
class RedisLock {
    connection;
    constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.connection = new ioredis_1.default(redisUrl);
    }
    async acquire(key, ttlMs) {
        const value = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        // Try to set key with NX (only if not exists)
        const result = await this.connection.set(key, value, 'PX', ttlMs, 'NX');
        if (result === 'OK') {
            return value;
        }
        return null;
    }
    async release(lockKey) {
        // In production, you'd verify the lock value matches before deleting
        // This is a simplified version
        await this.connection.del(lockKey);
    }
    async extend(key, value, ttlMs) {
        // Verify we still own the lock
        const currentValue = await this.connection.get(key);
        if (currentValue !== value) {
            return false;
        }
        const result = await this.connection.set(key, value, 'PX', ttlMs, 'XX');
        return result === 'OK';
    }
    async close() {
        await this.connection.quit();
    }
}
exports.RedisLock = RedisLock;
//# sourceMappingURL=redis-lock.js.map