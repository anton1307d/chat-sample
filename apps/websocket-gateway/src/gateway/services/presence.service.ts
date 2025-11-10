import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '../../redis/redis.decorator';
import { Redis } from 'ioredis';

@Injectable()
export class PresenceService {
    private readonly logger = new Logger(PresenceService.name);
    private readonly PRESENCE_TTL = 60; // seconds

    constructor(@InjectRedis() private redis: Redis) {}

    async setUserOnline(userId: string, socketId: string) {
        await this.redis.setex(
            `user:${userId}:online`,
            this.PRESENCE_TTL,
            'true',
        );

        this.logger.log(`User ${userId} is online`);
    }

    async setUserOffline(userId: string, socketId: string) {
        const sockets = await this.redis.smembers(`user:${userId}:sockets`);

        // Only mark offline if no other sockets
        if (sockets.length === 0) {
            await this.redis.del(`user:${userId}:online`);
            await this.redis.set(
                `user:${userId}:last_seen`,
                new Date().toISOString(),
            );
            this.logger.log(`User ${userId} is offline`);
        }
    }
}