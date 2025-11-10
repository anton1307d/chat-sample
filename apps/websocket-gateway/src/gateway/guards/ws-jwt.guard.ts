import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client: Socket = context.switchToWs().getClient();
            const token = this.extractToken(client);

            if (!token) {
                throw new WsException('Unauthorized');
            }

            const payload = this.jwtService.verify(token);
            client.data.userId = payload.userId;

            return true;
        } catch (error) {
            throw new WsException('Unauthorized');
        }
    }

    private extractToken(client: Socket): string | null {
        const auth = client.handshake.auth?.token ||
            client.handshake.headers?.authorization;

        if (!auth) return null;

        return auth.startsWith('Bearer ') ? auth.substring(7) : auth;
    }
}