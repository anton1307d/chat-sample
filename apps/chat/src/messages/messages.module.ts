import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message, MessageSchema } from './schemas/message.schema';
import { ConversationsModule } from '../conversations/conversations.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import {InternalServiceGuard} from "../guards/internal-service.guard";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
        ConversationsModule,
        RabbitMQModule,
    ],
    controllers: [MessagesController],
    providers: [MessagesService, InternalServiceGuard],
    exports: [MessagesService],
})
export class MessagesModule {}