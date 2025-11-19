import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@app/common';
import { Redis } from 'ioredis';
import { UsersService } from '../users/users.service';

@Injectable()
export class PresenceService {
    private readonly logger = new Logger(PresenceService.name);
    private readonly presenceTTL: number;

    constructor(
        @InjectRedis() private readonly redis: Redis,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        this.presenceTTL =
            parseInt(this.configService.get('PRESENCE_TTL_SECONDS')) || 60;
    }

    async setUserOnline(userId: string, socketId: string): Promise<void> {
        const key = `user:${userId}:online`;
        await this.redis.setex(key, this.presenceTTL, 'true');

        // Add socket to user's socket set
        await this.redis.sadd(`user:${userId}:sockets`, socketId);

        // Store socket to user mapping
        await this.redis.setex(
            `socket:${socketId}`,
            this.presenceTTL,
            JSON.stringify({ userId, connectedAt: new Date() }),
        );

        this.logger.log(`User ${userId} is now online (socket: ${socketId})`);
    }

    async setUserOffline(userId: string, socketId: string): Promise<void> {
        // Remove socket from user's socket set
        await this.redis.srem(`user:${userId}:sockets`, socketId);

        // Check if user has any other active sockets
        const activeSockets = await this.redis.scard(`user:${userId}:sockets`);

        if (activeSockets === 0) {
            // User is completely offline
            await this.redis.del(`user:${userId}:online`);

            // Set last seen
            const now = new Date();
            await this.redis.set(`user:${userId}:last_seen`, now.toISOString());

            // Update last seen in database
            await this.usersService.updateLastSeen(userId);

            this.logger.log(`User ${userId} is now offline`);
        }

        // Remove socket mapping
        await this.redis.del(`socket:${socketId}`);
    }

    async updateHeartbeat(userId: string): Promise<void> {
        const key = `user:${userId}:online`;
        const exists = await this.redis.exists(key);

        if (exists) {
            await this.redis.expire(key, this.presenceTTL);
        }
    }

    async isUserOnline(userId: string): Promise<boolean> {
        const key = `user:${userId}:online`;
        const exists = await this.redis.exists(key);
        return exists === 1;
    }

    async getLastSeen(userId: string): Promise<Date | null> {
        const lastSeen = await this.redis.get(`user:${userId}:last_seen`);

        if (lastSeen) {
            return new Date(lastSeen);
        }

        // Fallback to database
        const user = await this.usersService.findById(userId);
        return user.lastSeen || null;
    }

    async getUserPresence(userId: string) {
        const isOnline = await this.isUserOnline(userId);

        if (isOnline) {
            return {
                userId,
                status: 'online',
                lastSeen: null,
            };
        }

        const lastSeen = await this.getLastSeen(userId);

        return {
            userId,
            status: 'offline',
            lastSeen,
        };
    }

    async getBulkPresence(userIds: string[]) {
        const presences = await Promise.all(
            userIds.map((userId) => this.getUserPresence(userId)),
        );

        return presences;
    }
}