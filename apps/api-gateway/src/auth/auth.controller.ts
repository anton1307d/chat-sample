import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Public } from '@app/common';

@Controller('auth')
export class AuthController {
    private readonly usersServiceUrl: string;

    constructor(
        private httpService: HttpService,
        private configService: ConfigService,
    ) {
        this.usersServiceUrl = this.configService.get('USERS_SERVICE_URL');
    }

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: any) {
        const response = await firstValueFrom(
            this.httpService.post(`${this.usersServiceUrl}/auth/register`, dto),
        );
        return response.data;
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: any) {
        const response = await firstValueFrom(
            this.httpService.post(`${this.usersServiceUrl}/auth/login`, dto),
        );
        return response.data;
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() dto: any) {
        const response = await firstValueFrom(
            this.httpService.post(`${this.usersServiceUrl}/auth/refresh`, dto),
        );
        return response.data;
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Body() dto: any) {
        const response = await firstValueFrom(
            this.httpService.post(`${this.usersServiceUrl}/auth/logout`, dto),
        );
        return response.data;
    }
}