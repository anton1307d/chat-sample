import {
    Controller,
    Get,
    Put,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { HttpProxyService } from './services/http.service';
import { CurrentUser } from '@app/common';
import { ConfigService } from '@nestjs/config';

@Controller('users')
export class UsersController {
    private readonly usersServiceUrl: string;

    constructor(
        private httpProxy: HttpProxyService,
        private configService: ConfigService,
    ) {
        this.usersServiceUrl = this.configService.get('USERS_SERVICE_URL');
    }

    @Get('me')
    async getProfile(@CurrentUser('userId') userId: string) {
        return this.httpProxy.get(`${this.usersServiceUrl}/users/me`, {
            headers: { 'X-User-Id': userId },
        });
    }

    @Put('me')
    async updateProfile(
        @CurrentUser('userId') userId: string,
        @Body() dto: any,
    ) {
        return this.httpProxy.put(`${this.usersServiceUrl}/users/me`, dto, {
            headers: { 'X-User-Id': userId },
        });
    }

    @Get(':id')
    async getUserById(@Param('id') id: string) {
        return this.httpProxy.get(`${this.usersServiceUrl}/users/${id}`);
    }

    @Get('presence/:userId')
    async getPresence(@Param('userId') userId: string) {
        return this.httpProxy.get(
            `${this.usersServiceUrl}/presence/${userId}`,
        );
    }
}