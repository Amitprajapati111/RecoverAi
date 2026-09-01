"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
exports.getRedisClient = getRedisClient;
exports.connectRedis = connectRedis;
exports.disconnectRedis = disconnectRedis;
const ioredis_1 = require("ioredis");
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
let redisClient = null;
function getRedisClient() {
    if (!redisClient) {
        redisClient = new ioredis_1.Redis(env_1.env.REDIS_URL, {
            maxRetriesPerRequest: null,
            retryStrategy: (times) => {
                if (times > 5) {
                    logger_1.logger.error('Redis: Max retries reached');
                    return null;
                }
                return Math.min(times * 100, 3000);
            },
            lazyConnect: true,
        });
        redisClient.on('connect', () => logger_1.logger.info('✅ Redis connected'));
        redisClient.on('error', (err) => logger_1.logger.error('Redis error:', err));
        redisClient.on('reconnecting', () => logger_1.logger.warn('Redis reconnecting...'));
    }
    return redisClient;
}
async function connectRedis() {
    const client = getRedisClient();
    if (client.status === 'ready') {
        return;
    }
    if (client.status === 'connecting' || client.status === 'connect') {
        await new Promise((resolve, reject) => {
            const onReady = () => {
                cleanup();
                resolve();
            };
            const onError = (error) => {
                cleanup();
                reject(error);
            };
            const cleanup = () => {
                client.off('ready', onReady);
                client.off('error', onError);
            };
            client.once('ready', onReady);
            client.once('error', onError);
        });
        return;
    }
    await client.connect();
}
async function disconnectRedis() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
}
// Simple cache helpers
exports.cache = {
    async get(key) {
        const client = getRedisClient();
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
    },
    async set(key, value, ttlSeconds = 300) {
        const client = getRedisClient();
        await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    },
    async del(key) {
        const client = getRedisClient();
        await client.del(key);
    },
    async exists(key) {
        const client = getRedisClient();
        return (await client.exists(key)) === 1;
    },
    async delPattern(pattern) {
        const client = getRedisClient();
        let cursor = '0';
        let deleted = 0;
        do {
            const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                deleted += await client.del(...keys);
            }
        } while (cursor !== '0');
        return deleted;
    },
};
//# sourceMappingURL=redis.js.map