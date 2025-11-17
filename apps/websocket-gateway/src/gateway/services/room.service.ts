import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { InjectRedis } from '../../redis/redis.decorator';
import { Redis } from 'ioredis';

@Injectable()
export class RoomService {
    private readonly logger = new Logger(RoomService.name);

    constructor(@InjectRedis() private redis: Redis) {}

    async joinConversation(
        client: Socket,
        userId: string,
        conversationId: string,
    ) {
        const roomName = `conversation:${conversationId}`;
        client.join(roomName);

        // Track user's conversations in Redis
        await this.redis.sadd(`user:${userId}:conversations`, conversationId);

        this.logger.log(
            `User ${userId} joined conversation ${conversationId}`,
        );
    }

    async leaveConversation(client: Socket, conversationId: string) {
        const roomName = `conversation:${conversationId}`;
        client.leave(roomName);
    }

    async getUserConversations(userId: string): Promise<string[]> {
        return this.redis.smembers(`user:${userId}:conversations`);
    }

    async getConversationMembers(conversationId: string): Promise<string[]> {
        return this.redis.smembers(`conversation:${conversationId}`);
    }
}