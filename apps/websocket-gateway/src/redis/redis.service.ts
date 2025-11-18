import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redisClient: Redis,
    ) {}

    async onModuleDestroy() {
        await this.redisClient.quit();
        this.logger.log('Redis client disconnected');
    }

    getClient(): Redis {
        return this.redisClient;
    }

    async ping(): Promise<boolean> {
        try {
            const result = await this.redisClient.ping();
            return result === 'PONG';
        } catch (error) {
            this.logger.error('Redis ping failed:', error);
            return false;
        }
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        if (ttl) {
            await this.redisClient.setex(key, ttl, value);
        } else {
            await this.redisClient.set(key, value);
        }
    }

    async get(key: string): Promise<string | null> {
        return this.redisClient.get(key);
    }

    async del(key: string): Promise<number> {
        return this.redisClient.del(key);
    }

    async exists(key: string): Promise<number> {
        return this.redisClient.exists(key);
    }

    async keys(pattern: string): Promise<string[]> {
        return this.redisClient.keys(pattern);
    }

    // Hash operations
    async hset(key: string, field: string, value: string): Promise<number> {
        return this.redisClient.hset(key, field, value);
    }

    async hget(key: string, field: string): Promise<string | null> {
        return this.redisClient.hget(key, field);
    }

    async hgetall(key: string): Promise<Record<string, string>> {
        return this.redisClient.hgetall(key);
    }

    async hdel(key: string, field: string): Promise<number> {
        return this.redisClient.hdel(key, field);
    }

    // Set operations
    async sadd(key: string, member: string): Promise<number> {
        return this.redisClient.sadd(key, member);
    }

    async srem(key: string, member: string): Promise<number> {
        return this.redisClient.srem(key, member);
    }

    async smembers(key: string): Promise<string[]> {
        return this.redisClient.smembers(key);
    }

    async scard(key: string): Promise<number> {
        return this.redisClient.scard(key);
    }

    async sismember(key: string, member: string): Promise<number> {
        return this.redisClient.sismember(key, member);
    }

    // Counter operations
    async incr(key: string): Promise<number> {
        return this.redisClient.incr(key);
    }

    async decr(key: string): Promise<number> {
        return this.redisClient.decr(key);
    }

    async incrby(key: string, increment: number): Promise<number> {
        return this.redisClient.incrby(key, increment);
    }

    async decrby(key: string, decrement: number): Promise<number> {
        return this.redisClient.decrby(key, decrement);
    }
}