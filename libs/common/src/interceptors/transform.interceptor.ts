import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Response structure interface
 */
export interface Response<T> {
    data: T;
}

/**
 * Interceptor for transforming responses to a consistent format
 *
 * Wraps all responses in a { data: ... } object.
 * Useful for maintaining consistent API response structure.
 *
 * @example
 * // Before: { id: 1, name: 'John' }
 * // After:  { data: { id: 1, name: 'John' } }
 *
 * @example
 * // In controller or globally
 * @UseInterceptors(TransformInterceptor)
 */
@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>>
{
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        return next.handle().pipe(map((data) => ({ data })));
    }
}