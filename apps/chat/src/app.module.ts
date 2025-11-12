import { Module } from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { RedisModule } from './redis/redis.module';
import {LoggerModule} from "@app/common";
import {ConversationsModule} from "./conversations/conversations.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Participant} from "./conversations/entities/participant.entity";
import {Conversation} from "./conversations/entities/conversation.entity";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                url:  configService.get('DATABASE_URL'),
                entities: [Participant, Conversation],
                synchronize: true,
                logging: configService.get('NODE_ENV') === 'development',
            }),
            inject: [ConfigService],
        }),
        RedisModule,
        RabbitMQModule,
        LoggerModule,
        ConversationsModule,
    ],
})
export class AppModule {}