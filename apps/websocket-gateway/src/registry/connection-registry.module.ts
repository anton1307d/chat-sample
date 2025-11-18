import { Module, Global } from '@nestjs/common';
import { ConnectionRegistryService } from './connection-registry.service';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
    imports: [RedisModule],
    providers: [ConnectionRegistryService],
    exports: [ConnectionRegistryService],
})
export class ConnectionRegistryModule {}