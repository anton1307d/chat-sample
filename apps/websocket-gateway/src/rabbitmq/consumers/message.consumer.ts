import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQBaseConsumer, QueueConfig, ExchangeBinding } from '@app/common';
import { ChatGateway } from '../../gateway/chat.gateway';
import { Channel } from 'amqplib';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { RabbitMQService } from '../rabbitmq.service';

@Injectable()
export class MessageConsumer extends RabbitMQBaseConsumer {
    protected readonly logger = new Logger(MessageConsumer.name);
    constructor(
        private rabbitMQService: RabbitMQService,
        private chatGateway: ChatGateway,
    ) {
        super();
    }

    protected async getChannel(): Promise<Channel> {
        return this.rabbitMQService.getChannel();
    }

    protected getQueueConfig(): QueueConfig {
        return {
            name: 'message-delivery-queue',
            durable: true,
        };
    }

    protected getExchangeBindings(): ExchangeBinding[] {
        return [];
    }

    protected async processMessage(message: any): Promise<void> {
        this.logger.log(`Delivering message: ${message.messageId}`);
        await this.chatGateway.broadcastMessage(
            message.conversationId,
            message,
        );
    }
}
