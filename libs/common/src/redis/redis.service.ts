import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

/**
 * Redis service providing common Redis operations
 * Can be extended by services or used directly
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  protected readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(REDIS_CLIENT)
    protected readonly redisClient: Redis,
  ) {}

  async onModuleDestroy() {
    await this.redisClient.quit();
    this.logger.log('Redis client disconnected');
  }

  /**
   * Get the underlying Redis client for advanced operations
   */
  getClient(): Redis {
    return this.redisClient;
  }

  /**
   * Ping Redis to check connection
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.redisClient.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis ping failed:', error);
      return false;
    }
  }

  // ==================== String Operations ====================

  /**
   * Set a key-value pair with optional TTL
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.setex(key, ttl, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  /**
   * Set JSON object with optional TTL
   */
  async setJSON<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    const jsonString = JSON.stringify(value);
    await this.set(key, jsonString, ttl);
  }

  /**
   * Get JSON object by key
   */
  async getJSON<T = any>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to parse JSON for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete one or more keys
   */
  async del(...keys: string[]): Promise<number> {
    return this.redisClient.del(...keys);
  }

  /**
   * Check if key exists
   */
  async exists(...keys: string[]): Promise<number> {
    return this.redisClient.exists(...keys);
  }

  /**
   * Set expiration time on a key
   */
  async expire(key: string, seconds: number): Promise<number> {
    return this.redisClient.expire(key, seconds);
  }

  /**
   * Get time to live for a key
   */
  async ttl(key: string): Promise<number> {
    return this.redisClient.ttl(key);
  }

  /**
   * Get all keys matching pattern
   * WARNING: Use with caution in production
   */
  async keys(pattern: string): Promise<string[]> {
    return this.redisClient.keys(pattern);
  }

  /**
   * Scan keys matching pattern (safer than keys())
   */
  async scan(pattern: string, count = 100): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [newCursor, scannedKeys] = await this.redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        count,
      );
      cursor = newCursor;
      keys.push(...scannedKeys);
    } while (cursor !== '0');

    return keys;
  }

  // ==================== Hash Operations ====================

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: string): Promise<number> {
    return this.redisClient.hset(key, field, value);
  }

  /**
   * Set multiple hash fields
   */
  async hmset(key: string, data: Record<string, string | number>): Promise<'OK'> {
    return this.redisClient.hmset(key, data);
  }

  /**
   * Get hash field value
   */
  async hget(key: string, field: string): Promise<string | null> {
    return this.redisClient.hget(key, field);
  }

  /**
   * Get all hash fields and values
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    return this.redisClient.hgetall(key);
  }

  /**
   * Delete hash field
   */
  async hdel(key: string, ...fields: string[]): Promise<number> {
    return this.redisClient.hdel(key, ...fields);
  }

  /**
   * Check if hash field exists
   */
  async hexists(key: string, field: string): Promise<number> {
    return this.redisClient.hexists(key, field);
  }

  /**
   * Get all hash field names
   */
  async hkeys(key: string): Promise<string[]> {
    return this.redisClient.hkeys(key);
  }

  /**
   * Get all hash values
   */
  async hvals(key: string): Promise<string[]> {
    return this.redisClient.hvals(key);
  }

  /**
   * Get number of hash fields
   */
  async hlen(key: string): Promise<number> {
    return this.redisClient.hlen(key);
  }

  // ==================== Set Operations ====================

  /**
   * Add member(s) to set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.redisClient.sadd(key, ...members);
  }

  /**
   * Remove member(s) from set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    return this.redisClient.srem(key, ...members);
  }

  /**
   * Get all set members
   */
  async smembers(key: string): Promise<string[]> {
    return this.redisClient.smembers(key);
  }

  /**
   * Get set cardinality (size)
   */
  async scard(key: string): Promise<number> {
    return this.redisClient.scard(key);
  }

  /**
   * Check if member is in set
   */
  async sismember(key: string, member: string): Promise<number> {
    return this.redisClient.sismember(key, member);
  }

  /**
   * Get random member from set
   */
  async srandmember(key: string, count?: number): Promise<string | string[]> {
    return this.redisClient.srandmember(key, count);
  }

  /**
   * Remove and return random member from set
   */
  async spop(key: string, count?: number): Promise<string | string[]> {
    return this.redisClient.spop(key, count);
  }

  // ==================== List Operations ====================

  /**
   * Push element(s) to left of list
   */
  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.redisClient.lpush(key, ...values);
  }

  /**
   * Push element(s) to right of list
   */
  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.redisClient.rpush(key, ...values);
  }

  /**
   * Pop element from left of list
   */
  async lpop(key: string): Promise<string | null> {
    return this.redisClient.lpop(key);
  }

  /**
   * Pop element from right of list
   */
  async rpop(key: string): Promise<string | null> {
    return this.redisClient.rpop(key);
  }

  /**
   * Get list length
   */
  async llen(key: string): Promise<number> {
    return this.redisClient.llen(key);
  }

  /**
   * Get list range
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redisClient.lrange(key, start, stop);
  }

  /**
   * Trim list to specified range
   */
  async ltrim(key: string, start: number, stop: number): Promise<'OK'> {
    return this.redisClient.ltrim(key, start, stop);
  }

  // ==================== Sorted Set Operations ====================

  /**
   * Add member(s) to sorted set
   */
  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.redisClient.zadd(key, score, member);
  }

  /**
   * Get sorted set cardinality (size)
   */
  async zcard(key: string): Promise<number> {
    return this.redisClient.zcard(key);
  }

  /**
   * Get member score from sorted set
   */
  async zscore(key: string, member: string): Promise<string | null> {
    return this.redisClient.zscore(key, member);
  }

  /**
   * Get sorted set range by index
   */
  async zrange(
    key: string,
    start: number,
    stop: number,
    withScores?: boolean,
  ): Promise<string[]> {
    if (withScores) {
      return this.redisClient.zrange(key, start, stop, 'WITHSCORES');
    }
    return this.redisClient.zrange(key, start, stop);
  }

  /**
   * Get sorted set range by score
   */
  async zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
  ): Promise<string[]> {
    return this.redisClient.zrangebyscore(key, min, max);
  }

  /**
   * Remove member(s) from sorted set
   */
  async zrem(key: string, ...members: string[]): Promise<number> {
    return this.redisClient.zrem(key, ...members);
  }

  /**
   * Increment score of member in sorted set
   */
  async zincrby(key: string, increment: number, member: string): Promise<string> {
    return this.redisClient.zincrby(key, increment, member);
  }

  // ==================== Counter Operations ====================

  /**
   * Increment counter by 1
   */
  async incr(key: string): Promise<number> {
    return this.redisClient.incr(key);
  }

  /**
   * Decrement counter by 1
   */
  async decr(key: string): Promise<number> {
    return this.redisClient.decr(key);
  }

  /**
   * Increment counter by value
   */
  async incrby(key: string, increment: number): Promise<number> {
    return this.redisClient.incrby(key, increment);
  }

  /**
   * Decrement counter by value
   */
  async decrby(key: string, decrement: number): Promise<number> {
    return this.redisClient.decrby(key, decrement);
  }

  // ==================== Advanced Operations ====================

  /**
   * Execute multiple commands in pipeline
   */
  pipeline() {
    return this.redisClient.pipeline();
  }

  /**
   * Execute commands in transaction (MULTI/EXEC)
   */
  multi() {
    return this.redisClient.multi();
  }

  /**
   * Publish message to channel
   */
  async publish(channel: string, message: string): Promise<number> {
    return this.redisClient.publish(channel, message);
  }

  /**
   * Subscribe to channel(s)
   */
  async subscribe(...channels: string[]): Promise<void> {
    await this.redisClient.subscribe(...channels);
  }

  /**
   * Unsubscribe from channel(s)
   */
  async unsubscribe(...channels: string[]): Promise<void> {
    await this.redisClient.unsubscribe(...channels);
  }

  /**
   * Flush all keys in current database
   * WARNING: Use with extreme caution
   */
  async flushdb(): Promise<'OK'> {
    return this.redisClient.flushdb();
  }

  /**
   * Flush all keys in all databases
   * WARNING: Use with extreme caution
   */
  async flushall(): Promise<'OK'> {
    return this.redisClient.flushall();
  }
}