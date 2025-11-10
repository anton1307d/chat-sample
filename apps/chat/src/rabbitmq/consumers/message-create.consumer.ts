import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQBaseConsumer, QueueConfig, ExchangeBinding } from '@app/common';
import { Channel } from 'amqplib';
import { RabbitMQService } from '../rabbitmq.service';
import { MessagesService } from '../../messages/messages.service';
import { ConversationsService } from '../../conversations/conversations.service';
import { EVENTS } from '@app/contracts';

@Injectable()
export class MessageCreateConsumer extends RabbitMQBaseConsumer {
    protected readonly logger = new Logger(MessageCreateConsumer.name);

    constructor(
        private readonly rabbitMQService: RabbitMQService,
        private readonly messagesService: MessagesService,
        private readonly conversationsService: ConversationsService,
    ) {
        super();
    }

    protected async getChannel(): Promise<Channel> {
        return this.rabbitMQService.getChannel();
    }

    protected getQueueConfig(): QueueConfig {
        return {
            name: 'message-create-queue',
            durable: true,
            // arguments: {
            //     'x-message-ttl': 3600000,
            //     'x-max-length': 10000,
            //     'x-dead-letter-exchange': 'chat.dlx',
            // },
        };
    }

    protected getExchangeBindings(): ExchangeBinding[] {
        return [
            { exchange: 'chat.exchange', routingKey: 'message.create.request' },
        ];
    }

    protected getPrefetchCount(): number {
        return 5;
    }

    protected async processMessage(event: any): Promise<void> {
        if (!this.isValidEvent(event)) {
            throw new Error('Invalid event structure');
        }

        switch (event.eventType) {
            case EVENTS.MESSAGE_CREATE_REQUEST:
                await this.handleMessageCreateRequest(event);
                break;
            default:
                this.logger.warn(`Unknown event type: ${event.eventType}`);
        }
    }

    private async handleMessageCreateRequest(event: any): Promise<void> {
        const isParticipant = await this.conversationsService.isParticipant(
            event.conversationId,
            event.senderId,
        );

        if (!isParticipant) {
            await this.publishMessageError(event, 'Not a participant in this conversation');
            return;
        }

        if (!event.content || event.content.trim().length === 0) {
            await this.publishMessageError(event, 'Message content cannot be empty');
            return;
        }

        if (event.content.length > 10000) {
            await this.publishMessageError(event, 'Message content too long (max 10000 characters)');
            return;
        }

        const savedMessage = await this.messagesService.createMessage({
            conversationId: event.conversationId,
            senderId: event.senderId,
            content: event.content,
            type: event.type || 'text',
            metadata: event.metadata || {},
            replyTo: event.replyTo,
            mentions: event.mentions || [],
            attachments: event.attachments || [],
        });

        this.logger.log(`Message created in MongoDB: ${savedMessage._id}`);

        const participants = await this.conversationsService.getParticipants(
            event.conversationId,
        );

        await this.rabbitMQService.publish('chat.exchange', 'message.confirmed',{
            eventType: EVENTS.MESSAGE_CONFIRMED,
            tempMessageId: event.tempMessageId,
            messageId: savedMessage._id.toString(),
            conversationId: event.conversationId,
            senderId: event.senderId,
            sentAt: savedMessage.sentAt,
        });

        await this.rabbitMQService.publish('chat.exchange', 'message.sent',{
            eventType: EVENTS.MESSAGE_SENT,
            messageId: savedMessage._id.toString(),
            conversationId: event.conversationId,
            senderId: event.senderId,
            content: savedMessage.content,
            type: savedMessage.type,
            metadata: savedMessage.metadata,
            sentAt: savedMessage.sentAt,
            participants: participants.map((p) => p.userId),
        });

        this.logger.log(`Message delivery event published for ${participants.length} participants`);
    }

    private async publishMessageError(event: any, errorMessage: string): Promise<void> {
        await this.rabbitMQService.publish('chat.exchange', 'message.create.error', {
            eventType: EVENTS.MESSAGE_CREATE_ERROR,
            tempMessageId: event.tempMessageId,
            conversationId: event.conversationId,
            senderId: event.senderId,
            error: errorMessage,
            timestamp: new Date().toISOString(),
        });
    }

    private isValidEvent(event: any): boolean {
        return (
            event &&
            event.eventType &&
            event.senderId &&
            event.conversationId &&
            event.content !== undefined
        );
    }
}
