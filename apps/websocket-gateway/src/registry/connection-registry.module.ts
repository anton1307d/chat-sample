import { Module, Global } from '@nestjs/common';
import { ConnectionRegistryService } from './connection-registry.service';

@Global()
@Module({
    providers: [ConnectionRegistryService],
    exports: [ConnectionRegistryService],
})
export class ConnectionRegistryModule {}