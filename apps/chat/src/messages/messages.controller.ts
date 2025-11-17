import {
    Controller,
    Get,
    Param,
    Query, UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { GetMessagesDto } from './dto/get-messages.dto';
import { InternalServiceGuard } from '@app/common';

@Controller('messages')
@UseGuards(InternalServiceGuard)
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