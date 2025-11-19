import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GatewayModule } from './gateway/gateway.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import {LoggerModule, RedisModule} from "@app/common";
import {ConnectionRegistryModule} from "./registry/connection-registry.module";
import redisConfig from './config/redis.config';


@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            load: [redisConfig],
        }),
        RedisModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const redisConfig = configService.get('redis');
                return {
                    host: redisConfig.host,
                    port: redisConfig.port,
                    password: redisConfig.password,
                    db: redisConfig.db,
                    keyPrefix: redisConfig.keyPrefix,
                    connectTimeout: redisConfig.connectTimeout,
                    maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
                    enableReadyCheck: redisConfig.enableReadyCheck,
                    retryStrategy: redisConfig.retryStrategy,
                };
            },
            inject: [ConfigService],
        }),
        RabbitMQModule,
        GatewayModule,
        LoggerModule,
        ConnectionRegistryModule
    ],
})

export class AppModule {}