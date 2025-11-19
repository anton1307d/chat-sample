import { Injectable, HttpException, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

@Injectable()
export class HttpService {
    private readonly logger = new Logger(HttpService.name);
    private axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create();
    }

    async forward(url: string, method: string, data?: any, headers?: Record<string, string>) {
        try {
            const config: AxiosRequestConfig = {
                method,
                url,
                data,
                headers: {
                    ...headers,
                },
            };

            this.logger.log(`Sending request to: ${url} [${method}]`);

            const response = await this.axiosInstance.request(config);
            return response.data;
        } catch (error) {
            //
            this.logger.error(`Error forwarding request to ${url}:`, error.message);
            if (error.response) {
                throw new HttpException(
                    error.response.data,
                    error.response.status,
                );
            }
            throw error;
        }
    }
}
