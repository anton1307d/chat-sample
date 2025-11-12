import { Injectable, HttpException } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

@Injectable()
export class HttpService {
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

            console.log('Sending request to:', config);

            const response = await this.axiosInstance.request(config);
            return response.data;
        } catch (error) {
            //
            console.error('Error forwarding request:', error);
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
