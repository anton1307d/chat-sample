import { Controller, Get, Param } from '@nestjs/common';
import { ConnectionRegistryService } from '../registry/connection-registry.service';

@Controller('admin')
export class AdminController {
    constructor(
        private readonly connectionRegistry: ConnectionRegistryService,
    ) {}

    @Get('stats')
    async getStats() {
        return this.connectionRegistry.getStats();
    }

    @Get('connections')
    async getTotalConnections() {
        const total = await this.connectionRegistry.getTotalConnections();
        return { totalConnections: total };
    }

    @Get('connections/server/:serverId')
    async getServerConnections(@Param('serverId') serverId: string) {
        const count = await this.connectionRegistry.getServerConnections(serverId);
        return { serverId, connections: count };
    }

    @Get('connections/user/:userId')
    async getUserConnections(@Param('userId') userId: string) {
        const connections = await this.connectionRegistry.getUserConnections(userId);
        const isOnline = await this.connectionRegistry.isUserOnline(userId);

        return {
            userId,
            isOnline,
            connections,
            connectionCount: connections.length,
        };
    }

    @Get('users/online')
    async getOnlineUsers() {
        const users = await this.connectionRegistry.getOnlineUsers();
        return {
            onlineUsers: users,
            count: users.length,
        };
    }

    @Get('health')
    async getHealth() {
        const stats = await this.connectionRegistry.getStats();

        return {
            status: 'healthy',
            ...stats,
        };
    }
}