import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket, Server } from 'socket.io';
import { InjectRedis } from '../../redis/redis.decorator';
import { Redis } from 'ioredis';

@Injectable()
export class ConnectionService {
    private readonly logger = new Logger(ConnectionService.name);
    private server: Server;

    constructor(
        private jwtService: JwtService,
        @InjectRedis() private redis: Redis,
    ) {}

    setServer(server: Server) {
        this.server = server;
    }

    async handleConnection(client: Socket): Promise<string> {
        // Extract token
        const token =
            client.handshake.auth?.token ||
            client.handshake.headers?.authorization?.replace('Bearer ', '');

        if (!token) {
            throw new Error('No token provided');
        }

        // Verify token
        const payload = this.jwtService.verify(token);
        const userId = payload.userId;

        // Store socket-user mapping in Redis
        await this.redis.setex(
            `socket:${client.id}`,
            3600,
            JSON.stringify({ userId, connectedAt: new Date() }),
        );

        // Add socket to user's socket set
        await this.redis.sadd(`user:${userId}:sockets`, client.id);

        return userId;
    }

    async handleDisconnection(client: Socket): Promise<string | null> {
        // Get user ID
        const data = await this.redis.get(`socket:${client.id}`);

        if (!data) return null;

        const { userId } = JSON.parse(data);

        // Remove socket from user's set
        await this.redis.srem(`user:${userId}:sockets`, client.id);
        await this.redis.del(`socket:${client.id}`);

        return userId;
    }

    async getUserId(socketId: string): Promise<string> {
        const data = await this.redis.get(`socket:${socketId}`);
        if (!data) throw new Error('Socket not found');

        const { userId } = JSON.parse(data);
        return userId;
    }

    async getUserSockets(userId: string): Promise<string[]> {
        return this.redis.smembers(`user:${userId}:sockets`);
    }
}