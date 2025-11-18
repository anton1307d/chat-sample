import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import {
    REDIS_CLIENT,
} from './redis.constants';
import { RedisService } from './redis.service';
import redisConfig from './redis.config';

@Global()
@Module({
    imports: [ConfigModule.forFeature(redisConfig)],
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: (configService: ConfigService) => {
                const config = configService.get('redis');
                const client = new Redis({
                    host: config.host,
                    port: config.port,
                    password: config.password,
                    db: config.db,
                    keyPrefix: config.keyPrefix,
                    connectTimeout: config.connectTimeout,
                    maxRetriesPerRequest: config.maxRetriesPerRequest,
                    enableReadyCheck: config.enableReadyCheck,
                    retryStrategy: config.retryStrategy,
                });

                client.on('connect', () => {
                    console.log('✅ Redis client connected');
                });

                client.on('error', (err) => {
                    console.error('❌ Redis client error:', err);
                });

                return client;
            },
            inject: [ConfigService],
        },
        RedisService,
    ],
    exports: [
        REDIS_CLIENT,
        RedisService,
    ],
})
export class RedisModule {}