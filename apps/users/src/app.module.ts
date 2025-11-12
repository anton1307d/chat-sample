import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PresenceModule } from './presence/presence.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import {InternalServiceGuard, LoggerModule} from "@app/common";
import { User } from './users/entities/user.entity';
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
                entities: [User],
                synchronize: true,
                logging: configService.get('NODE_ENV') === 'development',
            }),
            inject: [ConfigService],
        }),
        RedisModule,
        AuthModule,
        UsersModule,
        PresenceModule,
        HealthModule,
        LoggerModule
    ]
})
export class AppModule {}