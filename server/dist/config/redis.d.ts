import { Redis } from 'ioredis';
export declare function getRedisClient(): Redis;
export declare function connectRedis(): Promise<void>;
export declare function disconnectRedis(): Promise<void>;
export declare const cache: {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    delPattern(pattern: string): Promise<number>;
};
//# sourceMappingURL=redis.d.ts.map