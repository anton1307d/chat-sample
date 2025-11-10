import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
    constructor(private rateLimitService: RateLimitService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const identifier = request.ip || request.user?.userId || 'anonymous';

        const allowed = await this.rateLimitService.checkLimit(identifier);

        if (!allowed) {
            throw new HttpException(
                'Too many requests',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        // Add rate limit info to response headers
        const remaining = await this.rateLimitService.getRemainingRequests(
            identifier,
        );
        request.res.setHeader('X-RateLimit-Remaining', remaining);

        return true;
    }
}