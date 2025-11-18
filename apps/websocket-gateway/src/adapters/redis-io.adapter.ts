import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-streams-adapter';
import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export class RedisIoAdapter extends IoAdapter {
    private readonly logger = new Logger(RedisIoAdapter.name);
    private adapterConstructor: ReturnType<typeof createAdapter>;
    private redisClient: Redis;

    constructor(
        private app: INestApplication,
        private configService: ConfigService,
    ) {
        super(app);
    }

    async connectToRedis(): Promise<void> {
        const redisConfig = this.configService.get('redis');

        this.logger.log('Connecting to Redis for Socket.IO Streams adapter...');

        this.redisClient = new Redis({
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
            db: redisConfig.db,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            lazyConnect: false,
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            enableOfflineQueue: true,
        });

        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Redis connection timeout after 10s'));
            }, 10000);

            this.redisClient.on('connect', () => {
                clearTimeout(timeout);
                this.logger.log('Redis Streams adapter client connected');
                resolve();
            });

            this.redisClient.on('ready', () => {
                this.logger.log('Redis Streams adapter client ready');
            });

            this.redisClient.on('error', (err) => {
                clearTimeout(timeout);
                this.logger.error('Redis Streams adapter client error:', err);
                reject(err);
            });

            this.redisClient.on('reconnecting', () => {
                this.logger.warn('Redis Streams adapter client reconnecting...');
            });

            this.redisClient.on('close', () => {
                this.logger.warn('⚠Redis Streams adapter client connection closed');
            });
        });

        this.adapterConstructor = createAdapter(this.redisClient, {
            streamName: 'socket.io:stream',
            maxLen: 10000,
            readCount: 100,
            heartbeatInterval: 100,
            heartbeatTimeout: 5000,
        });

        this.logger.log('Redis Streams adapter created');
        this.logger.log('Streams Config:');
        this.logger.log('   - Stream name: socket.io:stream');
        this.logger.log('   - Max messages: 10,000');
        this.logger.log('   - Read batch: 100 messages');
        this.logger.log('   - Heartbeat: 100ms');
        this.logger.log('   - Timeout: 5000ms');
    }

    createIOServer(port: number, options?: ServerOptions): any {
        const server = super.createIOServer(port, options);
        server.adapter(this.adapterConstructor);
        this.logger.log('Redis Streams adapter applied to Socket.IO server');

        return server;
    }

    async close(): Promise<void> {
        if (this.redisClient) {
            this.logger.log('Closing Redis Streams adapter connection...');
            await this.redisClient.quit();
            this.logger.log('Redis Streams adapter client disconnected');
        }
    }
}