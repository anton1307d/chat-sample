import { Controller, Get } from '@nestjs/common';
import { ConnectionRegistryService } from '../registry/connection-registry.service';

@Controller('health')
export class HealthController {
    constructor(
        private readonly connectionRegistry: ConnectionRegistryService,
    ) {}

    @Get('liveness')
    async getLiveness() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('readiness')
    async getReadiness() {
        try {
            const stats = await this.connectionRegistry.getStats();

            return {
                status: 'ready',
                redis: 'connected',
                stats,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: 'not_ready',
                redis: 'disconnected',
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    @Get('startup')
    async getStartup() {
        try {
            await this.connectionRegistry.getStats();

            return {
                status: 'started',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: 'starting',
                timestamp: new Date().toISOString(),
            };
        }
    }
}