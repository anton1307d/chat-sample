import { Module } from '@nestjs/common';
import { PresenceController } from './presence.controller';
import { PresenceService } from './presence.service';
import { UsersModule } from '../users/users.module';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [UsersModule, RedisModule],
    controllers: [PresenceController],
    providers: [PresenceService],
    exports: [PresenceService],
})
export class PresenceModule {}