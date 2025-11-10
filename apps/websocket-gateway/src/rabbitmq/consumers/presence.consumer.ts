import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQBaseConsumer, QueueConfig, ExchangeBinding } from '@app/common';
import { ChatGateway } from '../../gateway/chat.gateway';
import { Channel } from 'amqplib';
import {RabbitMQService} from "../rabbitmq.service";

@Injectable()
export class PresenceConsumer extends RabbitMQBaseConsumer {
    protected readonly logger = new Logger(PresenceConsumer.name);

    constructor(
        private readonly rabbitMQService: RabbitMQService,
        private chatGateway: ChatGateway,
    ) {
        super();
    }

    protected async getChannel(): Promise<Channel> {
        return this.rabbitMQService.getChannel();
    }

    protected getQueueConfig(): QueueConfig {
        return {
            name: 'presence-events-queue',
            durable: true,
        };
    }

    protected getExchangeBindings(): ExchangeBinding[] {
        return [];
    }

    protected async processMessage(event: any): Promise<void> {
        this.chatGateway.server.emit('presence:update', event);
    }
}
