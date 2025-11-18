import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQBaseConsumer, QueueConfig, ExchangeBinding } from '@app/common';
import { RabbitMQService } from '../rabbitmq.service';
import { ChatGateway } from '../../gateway/chat.gateway';
import { EVENTS } from '@app/contracts';
import { Channel } from 'amqplib';
import {ConnectionRegistryService} from "../../registry/connection-registry.service";

@Injectable()
export class MessageDeliveryConsumer extends RabbitMQBaseConsumer {
    protected readonly logger = new Logger(MessageDeliveryConsumer.name);

    constructor(
        private readonly rabbitMQService: RabbitMQService,
        private readonly chatGateway: ChatGateway,
        private readonly connectionRegistry: ConnectionRegistryService,
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
        try {
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
        } catch (error) {
            this.logger.error(`Error processing message: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Handle MESSAGE_SENT event from Chat Service
     */
    private async handleMessageSent(event: any) {
        try {
            const {
                messageId,
                conversationId,
                senderId,
                participants,
                content,
                type,
                metadata,
                sentAt,
                tempMessageId,
            } = event;

            this.logger.log(
                `Processing MESSAGE_SENT: ${messageId} in conversation ${conversationId}`,
            );

            if (!messageId || !conversationId || !senderId || !participants) {
                this.logger.error('Invalid MESSAGE_SENT event: missing required fields');
                return;
            }

            const messagePayload = {
                messageId,
                conversationId,
                senderId,
                content,
                type: type || 'text',
                metadata: metadata || {},
                sentAt,
                tempMessageId,
            };

            this.logger.log(
                `Message ${messageId} delivered: conversationId ${conversationId}, senderId ${senderId}, participants ${participants.join(', ')}`,
            );

            await this.chatGateway.broadcastMessage(conversationId, messagePayload);
        } catch (error) {
            this.logger.error(`Error handling MESSAGE_SENT: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Handle MESSAGE_CONFIRMED event from Chat Service
     */
    private async handleMessageConfirmed(event: any) {
        try {
            const { messageId, senderId, tempMessageId, conversationId, sentAt } = event;

            this.logger.log(`Processing MESSAGE_CONFIRMED: ${messageId} for user ${senderId}`);

            if (!messageId || !senderId) {
                this.logger.error('Invalid MESSAGE_CONFIRMED event: missing required fields');
                return;
            }

            await this.chatGateway.sendMessageConfirmation(senderId, {
                tempMessageId,
                messageId,
                conversationId,
                sentAt,
            });

            this.logger.log(`Confirmation sent for message: ${messageId}`);
        } catch (error) {
            this.logger.error(`Error handling MESSAGE_CONFIRMED: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Handle MESSAGE_CREATE_ERROR event from Chat Service
     */
    private async handleMessageError(event: any) {
        try {
            const { tempMessageId, senderId, error, conversationId } = event;

            this.logger.log(
                `Processing MESSAGE_CREATE_ERROR: ${tempMessageId} for user ${senderId}`,
            );

            if (!senderId || !tempMessageId) {
                this.logger.error('Invalid MESSAGE_CREATE_ERROR event: missing required fields');
                return;
            }

            const connections = await this.connectionRegistry.getUserConnections(senderId);

            if (connections.length === 0) {
                this.logger.warn(`Cannot send error notification to ${senderId}: user offline`);
                return;
            }

            for (const socketId of connections) {
                this.chatGateway.server.to(socketId).emit('message:error', {
                    tempMessageId,
                    error: error || 'Failed to send message',
                    conversationId,
                });
            }

            this.logger.log(
                `Error notification sent to user ${senderId} for message: ${tempMessageId}`,
            );
        } catch (error) {
            this.logger.error(`Error handling MESSAGE_CREATE_ERROR: ${error.message}`, error.stack);
        }
    }
}
