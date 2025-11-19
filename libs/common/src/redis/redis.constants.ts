/**
 * Default token for Redis client injection
 */
export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Token for Redis module options
 */
export const REDIS_MODULE_OPTIONS = 'REDIS_MODULE_OPTIONS';

/**
 * Default connection name
 */
export const DEFAULT_REDIS_CONNECTION = 'default';

/**
 * Get Redis client token for a specific connection name
 */
export function getRedisToken(name?: string): string {
  return name && name !== DEFAULT_REDIS_CONNECTION ? `${REDIS_CLIENT}_${name}` : REDIS_CLIENT;
}

/**
 * Get Redis options token for a specific connection name
 */
export function getRedisOptionsToken(name?: string): string {
  return name && name !== DEFAULT_REDIS_CONNECTION
    ? `${REDIS_MODULE_OPTIONS}_${name}`
    : REDIS_MODULE_OPTIONS;
}