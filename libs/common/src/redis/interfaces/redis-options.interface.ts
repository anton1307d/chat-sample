import { ModuleMetadata, Type } from '@nestjs/common';
import { RedisOptions as IORedisOptions } from 'ioredis';

/**
 * Redis module configuration options
 */
export interface RedisModuleOptions extends IORedisOptions {
  /**
   * Connection name for multiple Redis instances
   */
  name?: string;

  /**
   * Key prefix for all Redis keys
   */
  keyPrefix?: string;

  /**
   * Enable ready check
   * @default true
   */
  enableReadyCheck?: boolean;

  /**
   * Connect timeout in milliseconds
   * @default 10000
   */
  connectTimeout?: number;

  /**
   * Max retries per request
   * @default 3
   */
  maxRetriesPerRequest?: number;

  /**
   * Retry strategy function
   */
  retryStrategy?: (times: number) => number | void | null;

  /**
   * Called when connection is ready
   */
  onClientReady?: (client: any) => void;
}

/**
 * Factory for creating Redis options
 */
export interface RedisOptionsFactory {
  createRedisOptions(): Promise<RedisModuleOptions> | RedisModuleOptions;
}

/**
 * Async Redis module options
 */
export interface RedisModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * Connection name for multiple Redis instances
   */
  name?: string;

  /**
   * Factory function to create options
   */
  useFactory?: (...args: any[]) => Promise<RedisModuleOptions> | RedisModuleOptions;

  /**
   * Dependencies to inject into useFactory
   */
  inject?: any[];

  /**
   * Use existing options factory class
   */
  useExisting?: Type<RedisOptionsFactory>;

  /**
   * Use class to create options
   */
  useClass?: Type<RedisOptionsFactory>;
}