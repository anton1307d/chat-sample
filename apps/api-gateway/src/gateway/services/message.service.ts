import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '../../redis/redis.decorator';
import { Redis } from 'ioredis';

@Injectable()
export class MessageService {
    private readonly logger = new Logger(MessageService.name);

    constructor(@InjectRedis() private redis: Redis) {}

    async handleOutgoingMessage(userId: string, data: any) {
        // Store message temporarily (Chat Service will persist)
        const messageId = `temp:${Date.now()}:${userId}`;

        await this.redis.setex(
            `message:${messageId}`,
            300, // 5 minutes TTL
            JSON.stringify({
                ...data,
                senderId: userId,
                sentAt: new Date(),
            }),
        );

        // Publish to RabbitMQ (will be implemented in consumers)
        this.logger.log(`Message queued: ${messageId}`);

        return messageId;
    }

    async handleMessageRead(userId: string, messageId: string) {
        // Update read status
        await this.redis.sadd(`message:${messageId}:read`, userId);
        this.logger.log(`Message ${messageId} read by ${userId}`);
    }
}