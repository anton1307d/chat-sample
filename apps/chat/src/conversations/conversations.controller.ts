import {
    Controller,
    Get,
    Post,
    Body,
    Param, UseGuards
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { CurrentUser, InternalServiceGuard } from '@app/common';

@Controller('conversations')
@UseGuards(InternalServiceGuard)
export class ConversationsController {
    constructor(
        private readonly conversationsService: ConversationsService,
    ) {}

    @Post()
    async create(
        @CurrentUser() userId: string,
        @Body() dto: CreateConversationDto,
    ) {
        return this.conversationsService.create(userId, dto);
    }

    @Get()
    async findUserConversations(@CurrentUser('userId') userId: string) {
        return this.conversationsService.findUserConversations(userId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.conversationsService.findOne(id);
    }

    @Post(':id/participants')
    async addParticipant(
        @Param('id') conversationId: string,
        @Body() dto: AddParticipantDto,
    ) {
        return this.conversationsService.addParticipant(conversationId, dto);
    }

    @Post(':id/leave')
    async leaveConversation(
        @Param('id') conversationId: string,
        @CurrentUser('userId') userId: string,
    ) {
        return this.conversationsService.removeParticipant(conversationId, userId);
    }
}