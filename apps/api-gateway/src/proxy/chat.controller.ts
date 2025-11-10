import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { HttpProxyService } from './services/http.service';
import { CurrentUser } from '@app/common';
import { ConfigService } from '@nestjs/config';

@Controller('chat')
export class ChatController {
    private readonly chatServiceUrl: string;

    constructor(
        private httpProxy: HttpProxyService,
        private configService: ConfigService,
    ) {
        this.chatServiceUrl = this.configService.get('CHAT_SERVICE_URL');
    }

    // Conversations
    @Post('conversations')
    async createConversation(
        @CurrentUser('userId') userId: string,
        @Body() dto: any,
    ) {
        return this.httpProxy.post(
            `${this.chatServiceUrl}/conversations`,
            dto,
            {
                headers: { 'X-User-Id': userId },
            },
        );
    }

    @Get('conversations')
    async getConversations(@CurrentUser('userId') userId: string) {
        return this.httpProxy.get(`${this.chatServiceUrl}/conversations`, {
            headers: { 'X-User-Id': userId },
        });
    }

    @Get('conversations/:id')
    async getConversation(@Param('id') id: string) {
        return this.httpProxy.get(
            `${this.chatServiceUrl}/conversations/${id}`,
        );
    }

    // Messages
    @Post('messages')
    async sendMessage(
        @CurrentUser('userId') userId: string,
        @Body() dto: any,
    ) {
        return this.httpProxy.post(`${this.chatServiceUrl}/messages`, dto, {
            headers: { 'X-User-Id': userId },
        });
    }

    @Get('messages/conversation/:conversationId')
    async getMessages(
        @Param('conversationId') conversationId: string,
        @Query() query: any,
    ) {
        return this.httpProxy.get(
            `${this.chatServiceUrl}/messages/conversation/${conversationId}`,
            { params: query },
        );
    }

    @Post('messages/:messageId/read')
    async markAsRead(
        @Param('messageId') messageId: string,
        @CurrentUser('userId') userId: string,
    ) {
        return this.httpProxy.post(
            `${this.chatServiceUrl}/messages/${messageId}/read`,
            {},
            {
                headers: { 'X-User-Id': userId },
            },
        );
    }
}