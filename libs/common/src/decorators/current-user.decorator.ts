import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract the current user from request
 *
 * Usage:
 * - @CurrentUser() user - Get entire user object
 * - @CurrentUser('userId') userId - Get specific property
 *
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() user) {
 *   return user;
 * }
 *
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser('userId') userId: string) {
 *   return { userId };
 * }
 */
export const CurrentUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        return data ? user?.[data] : user;
    },
);