import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class HttpProxyService {
    private readonly logger = new Logger(HttpProxyService.name);

    constructor(private httpService: HttpService) {}

    async get(url: string, config?: AxiosRequestConfig) {
        try {
            const response = await firstValueFrom(
                this.httpService.get(url, config),
            );
            return response.data;
        } catch (error) {
            this.logger.error(`GET ${url} failed: ${error.message}`);
            throw error;
        }
    }

    async post(url: string, data: any, config?: AxiosRequestConfig) {
        try {
            const response = await firstValueFrom(
                this.httpService.post(url, data, config),
            );
            return response.data;
        } catch (error) {
            this.logger.error(`POST ${url} failed: ${error.message}`);
            throw error;
        }
    }

    async put(url: string, data: any, config?: AxiosRequestConfig) {
        try {
            const response = await firstValueFrom(
                this.httpService.put(url, data, config),
            );
            return response.data;
        } catch (error) {
            this.logger.error(`PUT ${url} failed: ${error.message}`);
            throw error;
        }
    }

    async delete(url: string, config?: AxiosRequestConfig) {
        try {
            const response = await firstValueFrom(
                this.httpService.delete(url, config),
            );
            return response.data;
        } catch (error) {
            this.logger.error(`DELETE ${url} failed: ${error.message}`);
            throw error;
        }
    }
}