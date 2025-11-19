import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Public, InjectRedis } from '@app/common';
import { Redis } from 'ioredis';

@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: TypeOrmHealthIndicator,
        @InjectRedis() private redis: Redis,
    ) {}

    @Get()
    @Public()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.db.pingCheck('database'),
            async () => {
                try {
                    await this.redis.ping();
                    return { redis: { status: 'up' } };
                } catch (error) {
                    return { redis: { status: 'down' } };
                }
            },
        ]);
    }

    @Get('live')
    @Public()
    live() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
}