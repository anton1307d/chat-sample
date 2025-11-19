import { Module, DynamicModule, Provider, Global, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  RedisModuleOptions,
  RedisModuleAsyncOptions,
  RedisOptionsFactory,
} from './interfaces/redis-options.interface';
import {
  REDIS_CLIENT,
  REDIS_MODULE_OPTIONS,
  getRedisToken,
  getRedisOptionsToken,
} from './redis.constants';
import { RedisService } from './redis.service';

/**
 * Redis Module
 * Provides dynamic configuration for Redis connections
 * Supports multiple Redis instances with different configurations
 */
@Global()
@Module({})
export class RedisModule {
  /**
   * Register Redis module synchronously
   * @param options Redis configuration options
   */
  static forRoot(options: RedisModuleOptions = {}): DynamicModule {
    const redisOptionsProvider: Provider = {
      provide: getRedisOptionsToken(options.name),
      useValue: options,
    };

    const redisClientProvider = this.createRedisClientProvider(options.name);

    const redisServiceProvider: Provider = {
      provide: RedisService,
      useFactory: (client: Redis) => {
        return new RedisService(client);
      },
      inject: [getRedisToken(options.name)],
    };

    return {
      module: RedisModule,
      providers: [redisOptionsProvider, redisClientProvider, redisServiceProvider],
      exports: [redisClientProvider, redisServiceProvider],
    };
  }

  /**
   * Register Redis module asynchronously
   * @param options Async Redis configuration options
   */
  static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
    const redisClientProvider = this.createRedisClientProvider(options.name);

    const redisServiceProvider: Provider = {
      provide: RedisService,
      useFactory: (client: Redis) => {
        return new RedisService(client);
      },
      inject: [getRedisToken(options.name)],
    };

    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: RedisModule,
      imports: options.imports || [],
      providers: [...asyncProviders, redisClientProvider, redisServiceProvider],
      exports: [redisClientProvider, redisServiceProvider],
    };
  }

  /**
   * Create Redis client provider
   */
  private static createRedisClientProvider(name?: string): Provider {
    return {
      provide: getRedisToken(name),
      useFactory: (options: RedisModuleOptions): Redis => {
        const logger = new Logger('RedisModule');

        // Create Redis client with options
        const client = new Redis({
          host: options.host || 'localhost',
          port: options.port || 6379,
          password: options.password,
          db: options.db || 0,
          keyPrefix: options.keyPrefix,
          connectTimeout: options.connectTimeout || 10000,
          maxRetriesPerRequest: options.maxRetriesPerRequest ?? 3,
          enableReadyCheck: options.enableReadyCheck ?? true,
          retryStrategy: options.retryStrategy || this.defaultRetryStrategy,
          ...options,
        });

        // Set up event listeners
        client.on('connect', () => {
          logger.log(
            `Redis client connected${name ? ` (${name})` : ''} to ${options.host}:${options.port}${options.db ? ` [DB: ${options.db}]` : ''}`,
          );
        });

        client.on('ready', () => {
          logger.log(`Redis client ready${name ? ` (${name})` : ''}`);
          if (options.onClientReady) {
            options.onClientReady(client);
          }
        });

        client.on('error', (err) => {
          logger.error(`Redis client error${name ? ` (${name})` : ''}:`, err.message);
        });

        client.on('close', () => {
          logger.warn(`Redis client closed${name ? ` (${name})` : ''}`);
        });

        client.on('reconnecting', (timeToReconnect: number) => {
          logger.log(
            `Redis client reconnecting${name ? ` (${name})` : ''} in ${timeToReconnect}ms`,
          );
        });

        client.on('end', () => {
          logger.warn(`Redis client connection ended${name ? ` (${name})` : ''}`);
        });

        return client;
      },
      inject: [getRedisOptionsToken(name)],
    };
  }

  /**
   * Create async providers for Redis options
   */
  private static createAsyncProviders(options: RedisModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    if (options.useClass) {
      return [
        this.createAsyncOptionsProvider(options),
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
      ];
    }

    return [];
  }

  /**
   * Create async options provider
   */
  private static createAsyncOptionsProvider(options: RedisModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: getRedisOptionsToken(options.name),
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    const inject = options.useExisting || options.useClass;

    return {
      provide: getRedisOptionsToken(options.name),
      useFactory: async (optionsFactory: RedisOptionsFactory) =>
        await optionsFactory.createRedisOptions(),
      inject: inject ? [inject] : [],
    };
  }

  /**
   * Default retry strategy
   */
  private static defaultRetryStrategy(times: number): number | null {
    if (times > 10) {
      // Stop retrying after 10 attempts
      return null;
    }
    // Exponential backoff: 50ms, 100ms, 200ms, ..., up to 2000ms
    return Math.min(times * 50, 2000);
  }
}