import { Module } from '@nestjs/common';
import { MessageConsumer } from './consumers/message.consumer';
import { PresenceConsumer } from './consumers/presence.consumer';
import { GatewayModule } from '../gateway/gateway.module';
import {MessageDeliveryConsumer} from "./consumers/message-delivery.consumer";
import {RabbitMQService} from "./rabbitmq.service";
import { forwardRef } from '@nestjs/common';
@Module({
    imports: [forwardRef(() => GatewayModule)],
    providers: [MessageConsumer, PresenceConsumer, MessageDeliveryConsumer, RabbitMQService],
    exports: [RabbitMQService],
})
export class RabbitMQModule {}