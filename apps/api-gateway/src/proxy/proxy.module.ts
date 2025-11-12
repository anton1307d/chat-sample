import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UsersController } from './users.controller';
import { ChatController } from './chat.controller';
import { HttpService } from './services/http.service';
import {AuthModule} from "../auth/auth.module";

@Module({
    imports: [HttpModule, AuthModule],
    controllers: [UsersController, ChatController],
    providers: [HttpService],
})
export class ProxyModule {}