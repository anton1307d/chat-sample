import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { ConnectionService } from './services/connection.service';
import { RoomService } from './services/room.service';
import { MessageService } from './services/message.service';
import { PresenceService } from './services/presence.service';

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        credentials: true,
    },
    namespace: '/chat',
})
export class ChatGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    constructor(
        private readonly connectionService: ConnectionService,
        private readonly roomService: RoomService,
        private readonly messageService: MessageService,
        private readonly presenceService: PresenceService,
    ) {}

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway initialized');
        this.connectionService.setServer(server);
    }

    async handleConnection(client: Socket) {
        try {
            const userId = await this.connectionService.handleConnection(client);
            this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

            await this.presenceService.setUserOnline(userId, client.id);
            client.join(`user:${userId}`);

            client.emit('connected', {
                socketId: client.id,
                userId,
                timestamp: new Date(),
            });
        } catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }

    async handleDisconnect(client: Socket) {
        const userId = await this.connectionService.handleDisconnection(client);

        if (userId) {
            this.logger.log(`Client disconnected: ${client.id}`);
            await this.presenceService.setUserOffline(userId, client.id);
        }
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('join:conversation')
    async handleJoinConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        const userId = await this.connectionService.getUserId(client.id);
        await this.roomService.joinConversation(
            client,
            userId,
            data.conversationId,
        );
        return { success: true, conversationId: data.conversationId };
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('leave:conversation')
    async handleLeaveConversation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        await this.roomService.leaveConversation(client, data.conversationId);
        return { success: true };
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('message:send')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any,
    ) {
        const userId = await this.connectionService.getUserId(client.id);
        await this.messageService.handleOutgoingMessage(userId, data);
        return { success: true };
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('typing:start')
    async handleTypingStart(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        const userId = await this.connectionService.getUserId(client.id);
        client.to(`conversation:${data.conversationId}`).emit('typing:start', {
            userId,
            conversationId: data.conversationId,
        });
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('typing:stop')
    async handleTypingStop(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { conversationId: string },
    ) {
        const userId = await this.connectionService.getUserId(client.id);
        client.to(`conversation:${data.conversationId}`).emit('typing:stop', {
            userId,
            conversationId: data.conversationId,
        });
    }

    // Broadcasting methods (called by RabbitMQ consumers)
    async broadcastMessage(conversationId: string, message: any) {
        this.server
            .to(`conversation:${conversationId}`)
            .emit('message:new', message);
    }

    async broadcastToUser(userId: string, event: string, data: any) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
}