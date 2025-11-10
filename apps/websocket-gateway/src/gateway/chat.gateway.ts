import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConnectionService } from './services/connection.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { EVENTS } from '@app/contracts';

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: 'chat',
})
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    constructor(
        private readonly connectionService: ConnectionService,
        private readonly rabbitMQService: RabbitMQService,
    ) {}

    @SubscribeMessage('message:send')
    async handleOutgoingMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: {
            conversationId: string;
            content: string;
            type?: string;
            metadata?: any;
        },
    ) {
        try {
            const userId = await this.connectionService.getUserId(client.id);

            if (!userId) {
                return {
                    success: false,
                    error: 'Not authenticated',
                };
            }

            if (!data.conversationId || !data.content) {
                return {
                    success: false,
                    error: 'Missing required fields',
                };
            }

            // 3. Generate temporary message ID
            const tempMessageId = `temp:${Date.now()}:${userId}`;

            // 4. Publish DIRECTLY to RabbitMQ (NO Redis storage)
            await this.rabbitMQService.publish('chat.exchange', 'message.create.request', {
                eventType: EVENTS.MESSAGE_CREATE_REQUEST,
                tempMessageId,
                conversationId: data.conversationId,
                senderId: userId,
                content: data.content,
                type: data.type || 'text',
                metadata: data.metadata || {},
                timestamp: new Date().toISOString(),
            });

            this.logger.log(
                `Message queued for processing: ${tempMessageId} from user ${userId}`,
            );

            return {
                success: true,
                messageId: tempMessageId, // Temporary ID until persisted
            };

        } catch (error) {
            this.logger.error(`Error handling outgoing message: ${error.message}`);

            return {
                success: false,
                error: 'Failed to queue message',
            };
        }
    }

    /**
     * Broadcast message to conversation participants
     * Called by RabbitMQ consumer after Chat Service persists message
     */
    async broadcastMessage(conversationId: string, message: any) {
        this.server
            .to(`conversation:${conversationId}`)
            .emit('message:new', message);

        this.logger.log(
            `Message broadcasted to conversation: ${conversationId}`,
        );
    }

    /**
     * Send message confirmation to original sender
     * After Chat Service persists the message
     */
    async sendMessageConfirmation(userId: string, data: any) {
        const socketIds = await this.connectionService.getUserSockets(userId);

        for (const socketId of socketIds) {
            this.server.to(socketId).emit('message:confirmed', {
                tempMessageId: data.tempMessageId,
                realMessageId: data.messageId,
                conversationId: data.conversationId,
                sentAt: data.sentAt,
            });
        }

        this.logger.log(`Message confirmation sent to user: ${userId}`);
    }

    @SubscribeMessage('message:delivered')
    async handleMessageDelivered(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { messageId: string },
    ) {
        const userId = await this.connectionService.getUserId(client.id);

        // Publish delivery receipt
        await this.rabbitMQService.publish('chat.exchange', 'message.status.delivered',{
            eventType: EVENTS.MESSAGE_DELIVERED,
            messageId: data.messageId,
            userId,
            deliveredAt: new Date().toISOString(),
        });

        this.logger.log(`Message ${data.messageId} delivered to ${userId}`);
    }

    @SubscribeMessage('message:read')
    async handleMessageRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { messageId: string; conversationId: string },
    ) {
        const userId = await this.connectionService.getUserId(client.id);

        // Publish read receipt
        await this.rabbitMQService.publish('chat.exchange', 'message.status.read',{
            eventType: EVENTS.MESSAGE_READ,
            messageId: data.messageId,
            conversationId: data.conversationId,
            userId,
            readAt: new Date().toISOString(),
        });

        this.logger.log(`Message ${data.messageId} read by ${userId}`);
    }
}