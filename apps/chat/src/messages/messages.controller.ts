import {
    Controller,
    Get,
    Post,
    Param,
    Query,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { GetMessagesDto } from './dto/get-messages.dto';

@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    @Get('conversation/:conversationId')
    async getMessages(
        @Param('conversationId') conversationId: string,
        @Query() query: GetMessagesDto,
    ) {
        return this.messagesService.getMessages(conversationId, query);
    }
}