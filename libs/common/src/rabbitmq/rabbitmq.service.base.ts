import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {connect, Connection, Channel, ChannelModel} from 'amqplib';

@Injectable()
export abstract class RabbitMQServiceBase implements OnModuleDestroy {
    protected abstract readonly logger: Logger;
    private connection: ChannelModel;
    private channel: Channel;

    constructor(protected readonly configService: ConfigService) {}

    async getChannel(): Promise<Channel> {
        if (!this.channel) {
            await this.connect();
        }
        return this.channel;
    }

    async getConnection(): Promise<ChannelModel> {
        if (!this.connection) {
            await this.connect();
        }
        return this.connection;
    }

    protected async connect(): Promise<void> {
        try {
            const uri = this.configService.get<string>('RABBITMQ_URL');
            if (!uri) {
                throw new Error('RABBITMQ_URL is not configured');
            }

            this.connection = await connect(uri);
            this.channel = await this.connection.createChannel();

            this.connection.on('error', (error) => {
                this.logger.error('RabbitMQ connection error', error.stack);
            });

            this.connection.on('close', () => {
                this.logger.warn('RabbitMQ connection closed');
            });

            this.logger.log('Connected to RabbitMQ');
        } catch (error) {
            this.logger.error('Failed to connect to RabbitMQ', error.stack);
            throw error;
        }
    }

    async publish(exchange: string, routingKey: string, message: any): Promise<void> {
        const channel = await this.getChannel();
        await channel.assertExchange(exchange, 'topic', { durable: true });
        channel.publish(
            exchange,
            routingKey,
            Buffer.from(JSON.stringify(message)),
            { persistent: true },
        );
    }

    async onModuleDestroy() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            this.logger.log('RabbitMQ connection closed');
        } catch (error) {
            this.logger.error('Error closing RabbitMQ connection', error.stack);
        }
    }
}
