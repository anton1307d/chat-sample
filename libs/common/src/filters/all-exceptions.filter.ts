import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';

/**
 * Global exception filter that catches ALL exceptions
 *
 * This is a safety net that catches any exception that wasn't
 * caught by more specific filters. Prevents server crashes and
 * ensures consistent error responses.
 *
 * @example
 * // In main.ts
 * app.useGlobalFilters(new AllExceptionsFilter());
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.message
                : 'Internal server error';

        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message,
        };

        this.logger.error(
            `${request.method} ${request.url}`,
            exception instanceof Error ? exception.stack : 'Unknown error',
        );

        response.status(status).json(errorResponse);
    }
}