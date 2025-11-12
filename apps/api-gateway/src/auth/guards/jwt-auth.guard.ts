import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '@app/common';

@Injectable()
export class JwtAuthGuard {
    constructor(
        private reflector: Reflector,
        private jwtService: JwtService,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);

        if (!token) {
            throw new UnauthorizedException('Missing authorization token');
        }

        try {
            const payload = this.jwtService.verify(token, {
                clockTolerance: 60,
            });
            request.user = payload;
            request.userId = payload.userId;
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }

    private extractToken(request: any): string | null {
        const auth = request.headers.authorization;
        if (!auth) return null;
        return auth.startsWith('Bearer ') ? auth.substring(7) : auth;
    }
}

