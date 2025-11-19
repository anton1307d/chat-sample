# Redis Module - Common Library

A flexible, dynamic Redis module for NestJS applications that supports multiple Redis instances with different configurations.

## Features

- ✅ Dynamic module configuration (forRoot/forRootAsync)
- ✅ Support for multiple Redis instances with different databases
- ✅ Comprehensive RedisService with common operations
- ✅ Type-safe decorator for dependency injection (@InjectRedis)
- ✅ Automatic connection management and reconnection
- ✅ Built on top of ioredis
- ✅ Flexible configuration per application

## Installation

The module is already part of `@app/common`, so you can import it directly:

```typescript
import { RedisModule, RedisService, InjectRedis } from '@app/common';
```

## Usage Examples

### Basic Usage (Single Redis Instance)

#### Using forRoot (Synchronous)

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { RedisModule } from '@app/common';

@Module({
  imports: [
    RedisModule.forRoot({
      host: 'localhost',
      port: 6379,
      password: 'your-password',
      db: 0,
      keyPrefix: 'myapp:',
    }),
  ],
})
export class AppModule {}
```

#### Using forRootAsync (with ConfigService)

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_DB', 0),
        keyPrefix: configService.get('REDIS_KEY_PREFIX', 'app:'),
        connectTimeout: 10000,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Multiple Redis Instances (Different Databases)

Different apps can use different Redis databases:

#### API Gateway - Using DB 0 for rate limiting

```typescript
// apps/api-gateway/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RedisModule.forRootAsync({
      name: 'ratelimit', // Named connection
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: 0, // Database 0 for rate limiting
        keyPrefix: 'ratelimit:',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

#### Users Service - Using DB 1 for sessions

```typescript
// apps/users/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: 1, // Database 1 for sessions
        keyPrefix: 'session:',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

#### WebSocket Gateway - Using DB 2 for Socket.IO adapter

```typescript
// apps/websocket-gateway/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RedisModule.forRootAsync({
      name: 'socketio',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: 2, // Database 2 for Socket.IO
        keyPrefix: 'socketio:',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

#### Chat Service - Using DB 3 for caching

```typescript
// apps/chat/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: 3, // Database 3 for caching
        keyPrefix: 'cache:',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## Using Redis in Services

### Option 1: Using RedisService (Recommended)

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '@app/common';

@Injectable()
export class MyService {
  constructor(private readonly redisService: RedisService) {}

  async cacheUser(userId: string, userData: any) {
    // Set JSON with 1 hour TTL
    await this.redisService.setJSON(`user:${userId}`, userData, 3600);
  }

  async getUser(userId: string) {
    // Get JSON
    return this.redisService.getJSON(`user:${userId}`);
  }

  async incrementCounter(key: string) {
    return this.redisService.incr(key);
  }
}
```

### Option 2: Using @InjectRedis Decorator (Direct Access)

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@app/common';
import { Redis } from 'ioredis';

@Injectable()
export class MyService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async customOperation() {
    // Direct access to ioredis client for advanced operations
    const pipeline = this.redis.pipeline();
    pipeline.set('key1', 'value1');
    pipeline.set('key2', 'value2');
    await pipeline.exec();
  }
}
```

### Option 3: Using Named Connection

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@app/common';
import { Redis } from 'ioredis';

@Injectable()
export class RateLimitService {
  constructor(
    @InjectRedis('ratelimit') private readonly rateLimitRedis: Redis,
  ) {}

  async checkRateLimit(userId: string): Promise<boolean> {
    const key = `ratelimit:${userId}`;
    const count = await this.rateLimitRedis.incr(key);

    if (count === 1) {
      // Set expiration on first request
      await this.rateLimitRedis.expire(key, 60);
    }

    return count <= 100; // 100 requests per minute
  }
}
```

## RedisService API

The `RedisService` provides a comprehensive set of methods:

### String Operations
- `set(key, value, ttl?)` - Set key-value pair
- `get(key)` - Get value by key
- `setJSON(key, value, ttl?)` - Set JSON object
- `getJSON(key)` - Get JSON object
- `del(...keys)` - Delete keys
- `exists(...keys)` - Check if keys exist
- `expire(key, seconds)` - Set expiration
- `ttl(key)` - Get time to live

### Hash Operations
- `hset(key, field, value)` - Set hash field
- `hget(key, field)` - Get hash field
- `hgetall(key)` - Get all hash fields
- `hdel(key, ...fields)` - Delete hash fields
- `hexists(key, field)` - Check if field exists
- `hkeys(key)` - Get all field names
- `hvals(key)` - Get all values

### Set Operations
- `sadd(key, ...members)` - Add members to set
- `srem(key, ...members)` - Remove members from set
- `smembers(key)` - Get all set members
- `scard(key)` - Get set size
- `sismember(key, member)` - Check membership

### List Operations
- `lpush(key, ...values)` - Push to left
- `rpush(key, ...values)` - Push to right
- `lpop(key)` - Pop from left
- `rpop(key)` - Pop from right
- `lrange(key, start, stop)` - Get range

### Sorted Set Operations
- `zadd(key, score, member)` - Add member with score
- `zrange(key, start, stop)` - Get range by index
- `zrangebyscore(key, min, max)` - Get range by score
- `zscore(key, member)` - Get member score

### Counter Operations
- `incr(key)` - Increment by 1
- `decr(key)` - Decrement by 1
- `incrby(key, increment)` - Increment by value
- `decrby(key, decrement)` - Decrement by value

### Advanced Operations
- `pipeline()` - Create pipeline for batch operations
- `multi()` - Create transaction
- `publish(channel, message)` - Publish to channel
- `subscribe(...channels)` - Subscribe to channels

## Configuration Options

```typescript
interface RedisModuleOptions {
  // Connection
  host?: string;              // Default: 'localhost'
  port?: number;              // Default: 6379
  password?: string;          // Optional password
  db?: number;                // Database number (0-15)

  // Naming
  name?: string;              // Connection name for multiple instances
  keyPrefix?: string;         // Prefix for all keys

  // Connection settings
  enableReadyCheck?: boolean; // Default: true
  connectTimeout?: number;    // Default: 10000ms
  maxRetriesPerRequest?: number; // Default: 3

  // Retry strategy
  retryStrategy?: (times: number) => number | null;

  // Callback
  onClientReady?: (client: Redis) => void;

  // All ioredis options are supported
}
```

## Environment Variables

Recommended environment variables for each app:

```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0                    # Different for each app
REDIS_KEY_PREFIX=app:         # Different for each app
```

## Best Practices

1. **Use different databases** for different apps or purposes:
   - DB 0: Rate limiting
   - DB 1: Sessions
   - DB 2: Socket.IO adapter
   - DB 3: Caching
   - DB 4: Message queues

2. **Use key prefixes** to avoid collisions:
   ```typescript
   keyPrefix: 'api-gateway:', // For API Gateway
   keyPrefix: 'chat:',        // For Chat Service
   keyPrefix: 'users:',       // For Users Service
   ```

3. **Use named connections** for multiple Redis instances in the same app:
   ```typescript
   @InjectRedis('cache') private cacheRedis: Redis
   @InjectRedis('sessions') private sessionRedis: Redis
   ```

4. **Set TTL on cached data** to prevent memory leaks:
   ```typescript
   await redisService.setJSON('user:123', userData, 3600); // 1 hour
   ```

5. **Use pipeline for batch operations**:
   ```typescript
   const pipeline = redisService.pipeline();
   pipeline.set('key1', 'value1');
   pipeline.set('key2', 'value2');
   await pipeline.exec();
   ```

6. **Handle errors gracefully**:
   ```typescript
   try {
     await redisService.set('key', 'value');
   } catch (error) {
     logger.error('Redis error:', error);
     // Fallback logic
   }
   ```

## Migration from Existing Code

If you have existing Redis modules in your apps, here's how to migrate:

### Before (app-specific)

```typescript
// apps/api-gateway/src/redis/redis.module.ts
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
```

### After (using common module)

```typescript
// apps/api-gateway/src/app.module.ts
import { RedisModule } from '@app/common';

@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        db: 0,
        keyPrefix: 'api-gateway:',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Update Decorator Usage

```typescript
// Before
import { InjectRedis } from '../redis/redis.decorator';

// After
import { InjectRedis } from '@app/common';
```

## Troubleshooting

### Connection Issues

```typescript
// Enable more verbose logging
RedisModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    host: configService.get('REDIS_HOST'),
    port: configService.get('REDIS_PORT'),
    onClientReady: (client) => {
      console.log('Redis client is ready!');
    },
  }),
  inject: [ConfigService],
})
```

### Multiple Connections Not Working

Make sure to use the `name` parameter:

```typescript
// Connection 1
RedisModule.forRootAsync({
  name: 'cache',
  // ...options
})

// Connection 2
RedisModule.forRootAsync({
  name: 'sessions',
  // ...options
})

// Inject
@InjectRedis('cache') private cacheRedis: Redis
@InjectRedis('sessions') private sessionRedis: Redis
```

## Resources

- [ioredis Documentation](https://github.com/redis/ioredis)
- [Redis Commands](https://redis.io/commands/)
- [NestJS Dynamic Modules](https://docs.nestjs.com/fundamentals/dynamic-modules)