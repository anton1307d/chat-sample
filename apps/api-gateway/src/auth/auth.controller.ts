import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Public } from '@app/common';
import { AxiosError } from 'axios';

@Controller('auth')
export class AuthController {
    private readonly usersServiceUrl: string;

    constructor(
        private httpService: HttpService,
        private configService: ConfigService,
    ) {
        this.usersServiceUrl = this.configService.getOrThrow('USER_SERVICE_URL');
    }

    private async forwardRequest(endpoint: string, dto: any) {
        try {
            const response = await firstValueFrom(
                this.httpService.post(`${this.usersServiceUrl}${endpoint}`, dto),
            );
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError && error.response?.status === 400) {
                throw new BadRequestException(error.response.data);
            }
            throw error;
        }
    }

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: any) {
        return this.forwardRequest('/auth/register', dto);
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: any) {
        return this.forwardRequest('/auth/login', dto);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() dto: any) {
        return this.forwardRequest('/auth/refresh', dto);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Body() dto: any) {
        return this.forwardRequest('/auth/logout', dto);
    }
}
