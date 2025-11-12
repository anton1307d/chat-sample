import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { Conversation } from './entities/conversation.entity';
import { Participant } from './entities/participant.entity';
import {InternalServiceGuard} from "@app/common";

@Module({
    imports: [TypeOrmModule.forFeature([Conversation, Participant])],
    controllers: [ConversationsController],
    providers: [ConversationsService, InternalServiceGuard],
    exports: [ConversationsService],
})
export class ConversationsModule {}