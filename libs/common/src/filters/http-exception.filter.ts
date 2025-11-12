import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Exception filter for handling HTTP exceptions
 *
 * Catches all HttpException instances and formats them consistently.
 * Logs errors with request information for debugging.
 *
 * @example
 * // In main.ts or module
 * app.useGlobalFilters(new HttpExceptionFilter());
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        const errorResponse: any = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message:
                typeof exceptionResponse === 'string'
                    ? exceptionResponse
                    : (exceptionResponse as any).message || 'Internal server error',
        };

        // Add validation errors if they exist
        if (typeof exceptionResponse === 'object' && (exceptionResponse as any).message) {
            const messages = (exceptionResponse as any).message;
            if (Array.isArray(messages)) {
                errorResponse.errors = messages;
            }
        }

        this.logger.error(
            `${request.method} ${request.url}`,
            JSON.stringify(errorResponse),
        );

        response.status(status).json(errorResponse);
    }
}
