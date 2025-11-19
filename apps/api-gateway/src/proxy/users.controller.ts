import { Controller, All, Req, Param, UseGuards, Logger } from '@nestjs/common';
import { Request } from 'express';
import { HttpService } from './services/http.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {ConfigService} from "@nestjs/config";
import {CurrentUser} from "@app/common";

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    private readonly logger = new Logger(UsersController.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly configsService: ConfigService
    ) {}

    @All('*path')
    async proxy(@Req() req: Request, @Param('path') path: string, @CurrentUser() userId: string) {

        const usersServiceUrl = this.configsService.getOrThrow<string>('USER_SERVICE_URL');
        const targetUrl = `${usersServiceUrl}/users/${path || ''}`;


        const headers = {
            'x-user-id': userId,
            'content-type': req.headers['content-type'],
        };

        this.logger.log(`Proxying request to: ${targetUrl} [user: ${userId}]`);

        return this.httpService.forward(
            targetUrl,
            req.method,
            req.body,
            headers,
        );
    }
}

