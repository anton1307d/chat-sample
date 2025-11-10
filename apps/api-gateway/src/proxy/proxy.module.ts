import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UsersController } from './users.controller';
import { ChatController } from './chat.controller';
import { HttpProxyService } from './services/http.service';

@Module({
    imports: [HttpModule],
    controllers: [UsersController, ChatController],
    providers: [HttpProxyService],
})
export class ProxyModule {}