import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { RoomService } from './services/room.service';
import { RedisModule } from '@app/common';
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
        RoomService,
    ],
    exports: [ChatGateway],
})
export class GatewayModule {}