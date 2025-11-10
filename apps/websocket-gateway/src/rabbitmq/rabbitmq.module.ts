import { Module } from '@nestjs/common';
import { MessageConsumer } from './consumers/message.consumer';
import { PresenceConsumer } from './consumers/presence.consumer';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
    imports: [GatewayModule],
    providers: [MessageConsumer, PresenceConsumer],
})
export class RabbitMQModule {}