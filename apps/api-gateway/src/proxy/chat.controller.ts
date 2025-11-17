import {Controller, All, Req, UseGuards, Param} from '@nestjs/common';
import { Request } from 'express';
import { HttpService } from './services/http.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {ConfigService} from "@nestjs/config";

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(
        private readonly httpService: HttpService,
        private readonly configsService: ConfigService
    ) {}

    @All('*path')
    async proxy(@Req() req: Request, @Param('path') path: string) {
        const chatServiceUrl = this.configsService.getOrThrow<string>('CHAT_SERVICE_URL');

        const targetUrl = `${chatServiceUrl}/${path.replaceAll(',', '/')}`;

        const headers = {
            'x-user-id': req['userId'],
            'content-type': req.headers['content-type'],
        };

        return this.httpService.forward(
            targetUrl,
            req.method,
            req.body,
            headers,
        );
    }
}
