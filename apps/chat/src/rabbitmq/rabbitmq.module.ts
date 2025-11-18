import { Module, Global, forwardRef } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { MessageCreateConsumer } from "./consumers/message-create.consumer";
import { ConversationsModule } from "../conversations/conversations.module";
import { MessagesModule } from "../messages/messages.module";


@Global()
@Module({
    imports: [ConversationsModule, forwardRef(() => MessagesModule)],
    providers: [RabbitMQService, MessageCreateConsumer],
    exports: [RabbitMQService],
})
export class RabbitMQModule {}