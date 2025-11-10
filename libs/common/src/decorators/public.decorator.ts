import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for marking routes as public
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark routes as public (skip authentication)
 *
 * Use this decorator on routes that don't require authentication
 * when you have a global auth guard enabled.
 *
 * @example
 * @Public()
 * @Post('login')
 * async login(@Body() loginDto: LoginDto) {
 *   return this.authService.login(loginDto);
 * }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);