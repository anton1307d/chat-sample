import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { EVENTS } from '@app/contracts';
import { RoomService } from './services/room.service';
import { ConnectionRegistryService } from '../registry/connection-registry.service';
import {JwtService} from "@nestjs/jwt";

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: 'chat',
})
export class ChatGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    constructor(
        private readonly connectionRegistry: ConnectionRegistryService,
        private readonly roomService: RoomService,
        private readonly rabbitMQService: RabbitMQService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ) {}

    /**
     * Gateway initialization - called once when server starts
     */
    async afterInit(server: Server) {
        this.logger.log('ChatGateway initialized');
        this.logger.log(`Server ID: ${this.configService.get('SERVER_ID') || process.pid}`);
        this.logger.log(`Namespace: /chat`);
    }

    /**
     * Handle new client connection
     * Called automatically when client connects via Socket.IO
     */
    async handleConnection(client: Socket) {
        try {
            const userId = this.extractUserId(client);
            const connectionId = client.id;

            if (!userId) {
                this.logger.warn(`Connection rejected: No user ID - ${connectionId}`);
                client.emit('connection:error', { error: 'Authentication required' });
                client.disconnect(true);
                return;
            }

            await this.connectionRegistry.registerConnection(userId, connectionId, {
                userAgent: client.handshake.headers['user-agent'],
                ip: client.handshake.address,
            });

            this.logger.log(`Client connected: ${connectionId}, User: ${userId}`);

            client.emit('connection:success', {
                userId,
                socketId: connectionId,
                serverId: this.configService.get('SERVER_ID') || process.pid,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            this.logger.error(`Connection failed: ${error.message}`, error.stack);
            client.emit('connection:error', { error: error.message });
            client.disconnect(true);
        }
    }

    /**
     * Handle client disconnection
     * Called automatically when client disconnects
     */
    async handleDisconnect(client: Socket) {
        try {
            const connectionId = client.id;

            // Get connection metadata from registry
            const metadata = await this.connectionRegistry.getConnectionMetadata(connectionId);

            if (!metadata) {
                this.logger.warn(`⚠️ Disconnect: No metadata found for ${connectionId}`);
                return;
            }

            const { userId } = metadata;

            await this.connectionRegistry.unregisterConnection(connectionId);

            this.logger.log(`Client disconnected: ${connectionId}, User: ${userId}`);
        } catch (error) {
            this.logger.error(`Disconnection error: ${error.message}`, error.stack);
        }
    }

    /**
     * Join conversation room
     * Triggered by: socket.emit('conversation:join', { conversationId })
     */
    @SubscribeMessage('conversation:join')
    async handleJoinConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        try {
            const metadata = await this.connectionRegistry.getConnectionMetadata(client.id);

            if (!metadata) {
                return { success: false, error: 'Not authenticated' };
            }

            const { userId } = metadata;

            if (!data.conversationId) {
                return { success: false, error: 'Conversation ID required' };
            }

            await this.roomService.joinConversation(client, userId, data.conversationId);

            this.logger.log(
                `User ${userId} joined conversation ${data.conversationId} (socket: ${client.id})`,
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
            if (!data.conversationId) {
                return { success: false, error: 'Conversation ID required' };
            }

            const metadata = await this.connectionRegistry.getConnectionMetadata(client.id);
            const userId = metadata?.userId;

            await this.roomService.leaveConversation(client, data.conversationId);

            this.logger.log(
                `Client ${client.id}${userId ? ` (User: ${userId})` : ''} left conversation ${data.conversationId}`,
            );

            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to leave conversation: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle outgoing message from client
     * Triggered by: socket.emit('message:send', { conversationId, content, ... })
     */
    @SubscribeMessage('message:send')
    async handleOutgoingMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody()
        data: {
            conversationId: string;
            content: string;
            type?: string;
            metadata?: any;
        },
    ) {
        try {
            const metadata = await this.connectionRegistry.getConnectionMetadata(client.id);

            if (!metadata) {
                return {
                    success: false,
                    error: 'Not authenticated',
                };
            }

            const { userId } = metadata;

            // Validate input
            if (!data.conversationId || !data.content) {
                return {
                    success: false,
                    error: 'Missing required fields: conversationId and content',
                };
            }

            const tempMessageId = `temp:${Date.now()}:${userId}`;

            // Publish to RabbitMQ for Chat Service to process
            await this.rabbitMQService.publish(
                'chat.exchange',
                'message.create.request',
                {
                    eventType: EVENTS.MESSAGE_CREATE_REQUEST,
                    tempMessageId,
                    conversationId: data.conversationId,
                    senderId: userId,
                    content: data.content,
                    type: data.type || 'text',
                    metadata: data.metadata || {},
                    timestamp: new Date().toISOString(),
                },
            );

            this.logger.log(
                `📤 Message queued: ${tempMessageId} from user ${userId} to conversation ${data.conversationId}`,
            );

            return {
                success: true,
                messageId: tempMessageId,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error(`Error handling outgoing message: ${error.message}`, error.stack);

            return {
                success: false,
                error: 'Failed to queue message',
            };
        }
    }

    async broadcastMessage(conversationId: string, message: any) {
        try {
            // Emit to all clients in the conversation room
            this.server.to(`conversation:${conversationId}`).emit('message:new', {
                messageId: message.messageId,
                conversationId: message.conversationId,
                senderId: message.senderId,
                content: message.content,
                type: message.type,
                metadata: message.metadata,
                sentAt: message.sentAt,
                tempMessageId: message.tempMessageId,
            });

            this.logger.log(
                `📢 Message ${message.messageId} broadcasted to conversation: ${conversationId}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to broadcast message to conversation ${conversationId}: ${error.message}`,
            );
        }
    }

    async sendMessageConfirmation(userId: string, data: any) {
        try {
            // Get all socket connections for this user (multiple devices)
            const connections = await this.connectionRegistry.getUserConnections(userId);

            if (connections.length === 0) {
                this.logger.warn(`No connections found for user ${userId} - cannot send confirmation`);
                return;
            }

            // Send confirmation to all user's devices
            for (const socketId of connections) {
                this.server.to(socketId).emit('message:confirmed', {
                    tempMessageId: data.tempMessageId,
                    realMessageId: data.messageId,
                    conversationId: data.conversationId,
                    sentAt: data.sentAt,
                });
            }

            this.logger.log(
                `Message confirmation sent to user ${userId} (${connections.length} device(s))`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to send confirmation to user ${userId}: ${error.message}`,
            );
        }
    }

    private extractUserId(socket: Socket): string | null {
        const token = socket.handshake.auth.token;
        if (token) {
            try {
                const decoded = this.jwtService.verify(token);
                return decoded.userId;
            } catch (error) {
                this.logger.error(`Failed to verify token: ${error.message}`);
                return null;
            }
        }

        return null;
    }
}