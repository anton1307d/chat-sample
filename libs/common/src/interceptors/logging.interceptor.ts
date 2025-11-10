import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor for logging HTTP requests and responses
 *
 * Logs:
 * - Request method and URL
 * - Response status code
 * - Request duration in milliseconds
 *
 * @example
 * // In controller or globally
 * @UseInterceptors(LoggingInterceptor)
 *
 * // Output: GET /users/123 200 - 45ms
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const url = request.url;
        const now = Date.now();

        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse();
                const delay = Date.now() - now;
                this.logger.log(
                    `${method} ${url} ${response.statusCode} - ${delay}ms`,
                );
            }),
        );
    }
}