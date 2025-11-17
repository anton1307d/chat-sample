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
import {PresenceService} from "./services/presence.service";
import {RoomService} from "./services/room.service";

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
        private readonly presenceService: PresenceService,
        private readonly roomService: RoomService,
        private readonly rabbitMQService: RabbitMQService,
    ) {}

    async afterInit(server: Server) {
        this.connectionService.setServer(server);
        this.logger.log('ChatGateway initialized');
    }

    /**
     * Called automatically when client connects
     */
    async handleConnection(client: Socket) {
        try {
            const userId = await this.connectionService.handleConnection(client);
            await this.presenceService.setUserOnline(userId, client.id);

            this.logger.log(`Client connected: ${client.id}, User: ${userId}`);

            client.emit('connection:success', {
                userId,
                socketId: client.id,
            });
        } catch (error) {
            this.logger.error(`Connection failed: ${error.message}`);
            client.emit('connection:error', { error: error.message });
            client.disconnect();
        }
    }

    async handleDisconnect(client: Socket) {
        try {
            const userId = await this.connectionService.handleDisconnection(client);

            if (userId) {
                await this.presenceService.setUserOffline(userId, client.id);
                this.logger.log(`Client disconnected: ${client.id}, User: ${userId}`);
            }
        } catch (error) {
            this.logger.error(`Disconnection error: ${error.message}`);
        }
    }

    @SubscribeMessage('conversation:join')
    async handleJoinConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        try {
            const userId = await this.connectionService.getUserId(client.id);

            if (!userId) {
                return { success: false, error: 'Not authenticated' };
            }

            await this.roomService.joinConversation(
                client,
                userId,
                data.conversationId,
            );

            this.logger.log(
                `User ${userId} joined conversation ${data.conversationId}`,
            );

            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to join conversation: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Leave conversation room
     * Triggered by: socket.emit('conversation:leave', { conversationId })
     */
    @SubscribeMessage('conversation:leave')
    async handleLeaveConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        try {
            await this.roomService.leaveConversation(client, data.conversationId);

            this.logger.log(
                `Client ${client.id} left conversation ${data.conversationId}`,
            );

            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to leave conversation: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

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

            const tempMessageId = `temp:${Date.now()}:${userId}`;

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
                messageId: tempMessageId,
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