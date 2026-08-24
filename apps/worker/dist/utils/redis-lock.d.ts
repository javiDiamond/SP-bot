export declare class RedisLock {
    private connection;
    constructor();
    acquire(key: string, ttlMs: number): Promise<string | null>;
    release(lockKey: string): Promise<void>;
    extend(key: string, value: string, ttlMs: number): Promise<boolean>;
    close(): Promise<void>;
}
//# sourceMappingURL=redis-lock.d.ts.map