import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@app/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimitService {
    private readonly ttl: number;
    private readonly max: number;

    constructor(
        @InjectRedis() private redis: Redis,
        private configService: ConfigService,
    ) {
        this.ttl = parseInt(this.configService.get('RATE_LIMIT_TTL')) || 60;
        this.max = parseInt(this.configService.get('RATE_LIMIT_MAX')) || 100;
    }

    async checkLimit(identifier: string): Promise<boolean> {
        const key = `rate_limit:${identifier}`;
        const current = await this.redis.incr(key);

        if (current === 1) {
            await this.redis.expire(key, this.ttl);
        }

        return current <= this.max;
    }

    async getRemainingRequests(identifier: string): Promise<number> {
        const key = `rate_limit:${identifier}`;
        const current = await this.redis.get(key);

        if (!current) return this.max;

        return Math.max(0, this.max - parseInt(current));
    }
}