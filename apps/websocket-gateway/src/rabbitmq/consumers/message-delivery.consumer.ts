import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQBaseConsumer, QueueConfig, ExchangeBinding } from '@app/common';
import { RabbitMQService } from '../rabbitmq.service';
import { ChatGateway } from '../../gateway/chat.gateway';
import { EVENTS } from '@app/contracts';
import { Channel } from 'amqplib';
import {InjectRedis} from "../../redis/redis.decorator";
import {Redis} from "ioredis";
import {PresenceService} from "../../gateway/services/presence.service";

@Injectable()
export class MessageDeliveryConsumer extends RabbitMQBaseConsumer {
    protected readonly logger = new Logger(MessageDeliveryConsumer.name);

    constructor(
        private readonly rabbitMQService: RabbitMQService,
        private readonly chatGateway: ChatGateway,
        private readonly presenceService: PresenceService,
        @InjectRedis() private redis: Redis,
    ) {
        super();
    }

    protected async getChannel(): Promise<Channel> {
        return this.rabbitMQService.getChannel();
    }
    protected getQueueConfig(): QueueConfig {
        return {
            name: 'message-delivery-queue',
            durable: true,
        };
    }

    protected getExchangeBindings(): ExchangeBinding[] {
        return [
            { exchange: 'chat.exchange', routingKey: 'message.sent' },
            { exchange: 'chat.exchange', routingKey: 'message.confirmed' },
            { exchange: 'chat.exchange', routingKey: 'message.create.error' },
        ];
    }

    protected async processMessage(event: any): Promise<void> {
        switch (event.eventType) {
            case EVENTS.MESSAGE_SENT:
                await this.handleMessageSent(event);
                break;
            case EVENTS.MESSAGE_CONFIRMED:
                await this.handleMessageConfirmed(event);
                break;
            case EVENTS.MESSAGE_CREATE_ERROR:
                await this.handleMessageError(event);
                break;
            default:
                this.logger.warn(`Unknown event type: ${event.eventType}`);
        }
    }

    private async handleMessageSent(event: any) {
        const { participants, senderId } = event;

        for (const userId of participants) {
            if (userId === senderId) continue;

            console.log("Sending message to user:", userId);

            const isOnline = await this.presenceService.isUserOnline(userId);

            if (isOnline) {
                const socketIds = await this.redis.smembers(`user:${userId}:sockets`);
                for (const socketId of socketIds) {
                    this.chatGateway.server.to(socketId).emit('message:new', {
                        messageId: event.messageId,
                        conversationId: event.conversationId,
                        senderId: event.senderId,
                        content: event.content,
                        type: event.type,
                        metadata: event.metadata,
                        sentAt: event.sentAt,
                    });
                }
                this.logger.log(`Message delivered to online user: ${userId}`);
            } else {
                await this.redis.lpush(`offline:${userId}`, event.messageId);
                this.logger.log(`Message queued for offline user: ${userId}`);
            }
        }
    }

    private async handleMessageConfirmed(event: any) {
        await this.chatGateway.sendMessageConfirmation(event.senderId, {
            tempMessageId: event.tempMessageId,
            messageId: event.messageId,
            conversationId: event.conversationId,
            sentAt: event.sentAt,
        });
        this.logger.log(`Confirmation sent for message: ${event.messageId}`);
    }

    private async handleMessageError(event: any) {
        const socketIds = await this.redis.smembers(`user:${event.senderId}:sockets`);
        for (const socketId of socketIds) {
            this.chatGateway.server.to(socketId).emit('message:error', {
                tempMessageId: event.tempMessageId,
                error: event.error,
            });
        }
        this.logger.log(`Error notification sent for: ${event.tempMessageId}`);
    }
}
