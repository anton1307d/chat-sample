import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { ConnectionService } from './services/connection.service';
import { RoomService } from './services/room.service';
import { MessageService } from './services/message.service';
import { PresenceService } from './services/presence.service';
import { RedisModule } from '../redis/redis.module';
import {RabbitMQModule} from "../rabbitmq/rabbitmq.module";
import { forwardRef } from '@nestjs/common';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
            }),
            inject: [ConfigService],
        }),
        RedisModule,
        forwardRef(() => RabbitMQModule)
    ],
    providers: [
        ChatGateway,
        ConnectionService,
        RoomService,
        MessageService,
        PresenceService,
    ],
    exports: [ChatGateway],
})
export class GatewayModule {}