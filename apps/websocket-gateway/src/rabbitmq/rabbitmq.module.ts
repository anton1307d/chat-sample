import { Module } from '@nestjs/common';
import { PresenceConsumer } from './consumers/presence.consumer';
import { GatewayModule } from '../gateway/gateway.module';
import {MessageDeliveryConsumer} from "./consumers/message-delivery.consumer";
import {RabbitMQService} from "./rabbitmq.service";
import { forwardRef } from '@nestjs/common';

@Module({
    imports: [forwardRef(() => GatewayModule)],
    providers: [PresenceConsumer, MessageDeliveryConsumer, RabbitMQService],
    exports: [RabbitMQService],
})
export class RabbitMQModule {}