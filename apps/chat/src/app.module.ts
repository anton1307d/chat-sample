import { Module } from '@nestjs/common';
import {ConfigModule, ConfigService} from '@nestjs/config';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { RedisModule } from './redis/redis.module';
import {LoggerModule} from "@app/common";
import {ConversationsModule} from "./conversations/conversations.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Participant} from "./conversations/entities/participant.entity";
import {Conversation} from "./conversations/entities/conversation.entity";
import {MessagesModule} from "./messages/messages.module";
import {MongooseModule} from "@nestjs/mongoose";

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
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                uri: configService.get('MONGODB_URI'),
            }),
            inject: [ConfigService],
        }),
        RedisModule,
        RabbitMQModule,
        LoggerModule,
        ConversationsModule,
        MessagesModule,
    ],
})
export class AppModule {}