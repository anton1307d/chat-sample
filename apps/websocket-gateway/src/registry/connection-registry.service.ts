import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { ConnectionMetadata, ConnectionStats } from './connection-registry.interface';

@Injectable()
export class ConnectionRegistryService {
    private readonly logger = new Logger(ConnectionRegistryService.name);
    private readonly serverId: string;

    private readonly KEYS = {
        userConnections: (userId: string) => `user:${userId}:connections`,
        connectionMeta: (connectionId: string) => `connection:${connectionId}`,
        serverConnections: (serverId: string) => `server:${serverId}:connections`,
        totalConnections: 'total:connections',
        onlineUsers: 'users:online',
    };

    constructor(
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) {
        this.serverId = this.configService.get<string>('SERVER_ID') || `server-${process.pid}`;
        this.logger.log(`Connection Registry initialized for server: ${this.serverId}`);
    }

    /**
     * Register a new connection
     */
    async registerConnection(
        userId: string,
        connectionId: string,
        metadata?: Partial<ConnectionMetadata>,
    ): Promise<void> {
        try {
            const redis = this.redisService.getClient();
            const pipeline = redis.pipeline();

            // 1. Add connection to user's connections set
            pipeline.sadd(this.KEYS.userConnections(userId), connectionId);

            // 2. Store connection metadata as hash
            const metaData: ConnectionMetadata = {
                userId,
                connectionId,
                serverId: this.serverId,
                connectedAt: new Date().toISOString(),
                ...metadata,
            };

            const metaHash = Object.entries(metaData).reduce((acc, [key, value]) => {
                acc[key] = String(value);
                return acc;
            }, {} as Record<string, string>);

            pipeline.hmset(this.KEYS.connectionMeta(connectionId), metaHash);

            pipeline.sadd(this.KEYS.serverConnections(this.serverId), connectionId);

            pipeline.sadd(this.KEYS.onlineUsers, userId);

            pipeline.incr(this.KEYS.totalConnections);

            await pipeline.exec();

            this.logger.log(
                `✅ Registered: userId=${userId}, connectionId=${connectionId}, serverId=${this.serverId}`,
            );
        } catch (error) {
            this.logger.error('Failed to register connection:', error);
            throw error;
        }
    }

    /**
     * Unregister a connection
     */
    async unregisterConnection(connectionId: string): Promise<void> {
        try {
            const redis = this.redisService.getClient();

            const metadata = await redis.hgetall(this.KEYS.connectionMeta(connectionId));

            if (!metadata || !metadata.userId) {
                this.logger.warn(`Connection ${connectionId} not found`);
                return;
            }

            const { userId, serverId } = metadata;
            const pipeline = redis.pipeline();

            pipeline.srem(this.KEYS.userConnections(userId), connectionId);

            pipeline.del(this.KEYS.connectionMeta(connectionId));

            // 4. Remove from server's connections
            pipeline.srem(this.KEYS.serverConnections(serverId), connectionId);

            // 5. Check if user has remaining connections
            const remainingConnections = await redis.scard(this.KEYS.userConnections(userId));

            if (remainingConnections === 0) {
                pipeline.srem(this.KEYS.onlineUsers, userId);
            }

            // 6. Decrement total connections
            pipeline.decr(this.KEYS.totalConnections);

            await pipeline.exec();

            this.logger.log(`Unregistered: userId=${userId}, connectionId=${connectionId}`);
        } catch (error) {
            this.logger.error('Failed to unregister connection:', error);
            throw error;
        }
    }

    async getUserConnections(userId: string): Promise<string[]> {
        return this.redisService.smembers(this.KEYS.userConnections(userId));
    }

    async getConnectionMetadata(connectionId: string): Promise<ConnectionMetadata | null> {
        const metadata = await this.redisService.hgetall(this.KEYS.connectionMeta(connectionId));

        if (!metadata || !metadata.userId) {
            return null;
        }

        return metadata as unknown as ConnectionMetadata;
    }

    async isUserOnline(userId: string): Promise<boolean> {
        const result = await this.redisService.sismember(this.KEYS.onlineUsers, userId);
        return result === 1;
    }

    async getOnlineUsers(): Promise<string[]> {
        return this.redisService.smembers(this.KEYS.onlineUsers);
    }

    async getTotalConnections(): Promise<number> {
        const count = await this.redisService.get(this.KEYS.totalConnections);
        return parseInt(count || '0', 10);
    }

    async getServerConnections(serverId: string): Promise<number> {
        return this.redisService.scard(this.KEYS.serverConnections(serverId));
    }

    async getCurrentServerConnections(): Promise<number> {
        return this.getServerConnections(this.serverId);
    }

    async getStats(): Promise<ConnectionStats> {
        const [totalConnections, onlineUsersCount, currentServerConnections] = await Promise.all([
            this.getTotalConnections(),
            this.redisService.scard(this.KEYS.onlineUsers),
            this.getCurrentServerConnections(),
        ]);

        return {
            serverId: this.serverId,
            totalConnections,
            onlineUsers: onlineUsersCount,
            currentServerConnections,
            timestamp: new Date().toISOString(),
        };
    }
}