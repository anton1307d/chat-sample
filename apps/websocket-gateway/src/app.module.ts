import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GatewayModule } from './gateway/gateway.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { RedisModule } from './redis/redis.module';
import {LoggerModule} from "@app/common";
import {ConnectionRegistryModule} from "./registry/connection-registry.module";


@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        RedisModule,
        RabbitMQModule,
        GatewayModule,
        LoggerModule,
        ConnectionRegistryModule
    ],
})

export class AppModule {}