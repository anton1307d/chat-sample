import { Logger, OnModuleInit } from '@nestjs/common';
import { Channel, ConsumeMessage } from 'amqplib';

export interface QueueConfig {
    name: string;
    durable?: boolean;
    exclusive?: boolean;
    autoDelete?: boolean;
}

export interface ExchangeBinding {
    exchange: string;
    routingKey: string;
}

export interface RetryConfig {
    maxRetries: number;
    retryDelay: number;
    deadLetterExchange: string;
    deadLetterQueue: string;
}



export abstract class RabbitMQBaseConsumer implements OnModuleInit {
    protected abstract readonly logger: Logger;
    protected abstract getChannel(): Promise<Channel>;
    protected abstract getQueueConfig(): QueueConfig;
    protected abstract getExchangeBindings?(): ExchangeBinding[];
    protected abstract processMessage(event: any): Promise<void>;

    protected getRetryConfig(): RetryConfig {
        const queueName = this.getQueueConfig().name;
        return {
            maxRetries: 3,
            retryDelay: 5000,
            deadLetterExchange: 'dlx.exchange',
            deadLetterQueue: `${queueName}.dlq`,
        };
    }

    protected getIdempotencyTTL(): number {
        return 86400; // 24 hours
    }

    async onModuleInit() {
        try {
            const channel = await this.getChannel();
            const config = this.getQueueConfig();
            const retryConfig = this.getRetryConfig();

            // Setup DLX and DLQ
            await this.setupDeadLetterQueue(channel, retryConfig);

            // Assert main queue with DLX configuration
            await channel.assertQueue(config.name, {
                durable: config.durable ?? true,
                exclusive: config.exclusive ?? false,
                autoDelete: config.autoDelete ?? false,
                arguments: {
                    'x-dead-letter-exchange': retryConfig.deadLetterExchange,
                    'x-dead-letter-routing-key': config.name,
                },
            });

            // Bind to exchanges if specified
            const bindings = this.getExchangeBindings?.() || [];
            for (const binding of bindings) {
                await channel.bindQueue(
                    config.name,
                    binding.exchange,
                    binding.routingKey,
                );
            }

            // Start consuming
            await channel.consume(
                config.name,
                async (msg) => await this.handleMessage(msg, channel),
                { noAck: false },
            );

            this.logger.log(`${this.constructor.name} started - listening on ${config.name}`);
        } catch (error) {
            this.logger.error(`Failed to initialize consumer: ${error.message}`, error.stack);
            throw error;
        }
    }

    private async setupDeadLetterQueue(channel: Channel, retryConfig: RetryConfig) {
        // Assert DLX
        await channel.assertExchange(retryConfig.deadLetterExchange, 'topic', {
            durable: true,
        });

        // Assert DLQ
        await channel.assertQueue(retryConfig.deadLetterQueue, {
            durable: true,
        });

        // Bind DLQ to DLX
        await channel.bindQueue(
            retryConfig.deadLetterQueue,
            retryConfig.deadLetterExchange,
            '#',
        );
    }

    private async handleMessage(msg: ConsumeMessage | null, channel: Channel) {
        if (!msg) return;

        const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) as number;
        const retryConfig = this.getRetryConfig();

        try {
            const event = JSON.parse(msg.content.toString());

            // Check idempotency
            // if (await this.isDuplicate(event)) {
            //     this.logger.warn(`Duplicate message detected, skipping: ${this.getMessageId(event)}`);
            //     channel.ack(msg);
            //     return;
            // }

            // Process message
            await this.processMessage(event);

            // Mark as processed
            // await this.markAsProcessed(event);

            channel.ack(msg);
        } catch (error) {
            this.logger.error(
                `Error processing message (attempt ${retryCount + 1}/${retryConfig.maxRetries}): ${error.message}`,
                error.stack,
            );

            if (retryCount < retryConfig.maxRetries) {
                // Reject and requeue with incremented retry count
                channel.nack(msg, false, false);

                // Publish back to queue with updated retry count
                channel.publish(
                    '',
                    this.getQueueConfig().name,
                    msg.content,
                    {
                        ...msg.properties,
                        headers: {
                            ...msg.properties.headers,
                            'x-retry-count': retryCount + 1,
                        },
                    },
                );
            } else {
                // Max retries exceeded, message will go to DLQ
                channel.nack(msg, false, false);
                this.logger.error(
                    `Message sent to DLQ after ${retryConfig.maxRetries} retries: ${this.getMessageId(JSON.parse(msg.content.toString()))}`,
                );
            }
        }
    }

    private getMessageId(event: any): string {
        return event.messageId || event.id || JSON.stringify(event);
    }

    private getIdempotencyKey(messageId: string): string {
        return `processed:${this.constructor.name}:${messageId}`;
    }
}
