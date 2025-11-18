import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import {RedisService} from "../../redis/redis.service";

@Injectable()
export class RoomService {
    private readonly logger = new Logger(RoomService.name);

    constructor(private redis: RedisService) {}

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