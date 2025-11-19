import { Inject } from '@nestjs/common';
import { getRedisToken } from './redis.constants';

/**
 * Decorator to inject Redis client
 * @param name Optional connection name for multiple Redis instances
 *
 * @example
 * // Inject default Redis client
 * constructor(@InjectRedis() private readonly redis: Redis) {}
 *
 * @example
 * // Inject named Redis client
 * constructor(@InjectRedis('cache') private readonly cacheRedis: Redis) {}
 */
export const InjectRedis = (name?: string) => Inject(getRedisToken(name));