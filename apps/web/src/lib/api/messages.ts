import axios from 'axios';
import type { Message, SendMessageDto } from '@/types/message.types';

// @ts-ignore
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
});

export const messagesApi = {
    async getMessages(
        conversationId: string,
        limit: number = 50,
        before?: string,
    ): Promise<{
        messages: Message[];
        hasMore: boolean;
        nextCursor?: string;
    }> {
        const params = new URLSearchParams({
            conversationId,
            limit: limit.toString(),
        });

        if (before) {
            params.append('before', before);
        }

        const response = await axios.get(`${API_URL}/chat/messages?${params}`, {
            headers: getAuthHeaders(),
        });

        return response.data;
    },

    async sendMessage(data: SendMessageDto): Promise<Message> {
        const response = await axios.post(
            `${API_URL}/chat/messages`,
            data,
            {
                headers: getAuthHeaders(),
            },
        );
        return response.data;
    },

    async editMessage(messageId: string, content: string): Promise<Message> {
        const response = await axios.patch(
            `${API_URL}/chat/messages/${messageId}`,
            { content },
            {
                headers: getAuthHeaders(),
            },
        );
        return response.data;
    },

    async deleteMessage(messageId: string): Promise<void> {
        await axios.delete(`${API_URL}/chat/messages/${messageId}`, {
            headers: getAuthHeaders(),
        });
    },

    async markAsRead(messageId: string): Promise<void> {
        await axios.patch(
            `${API_URL}/chat/messages/${messageId}/read`,
            {},
            {
                headers: getAuthHeaders(),
            },
        );
    },

    async markConversationAsRead(conversationId: string): Promise<void> {
        await axios.patch(
            `${API_URL}/chat/messages/conversations/${conversationId}/read`,
            {},
            {
                headers: getAuthHeaders(),
            },
        );
    },

    async addReaction(messageId: string, emoji: string): Promise<Message> {
        const response = await axios.post(
            `${API_URL}/chat/messages/${messageId}/reactions`,
            { emoji },
            {
                headers: getAuthHeaders(),
            },
        );
        return response.data;
    },

    async removeReaction(messageId: string, emoji: string): Promise<Message> {
        const response = await axios.delete(
            `${API_URL}/chat/messages/${messageId}/reactions/${emoji}`,
            {
                headers: getAuthHeaders(),
            },
        );
        return response.data;
    },

    async searchMessages(
        conversationId: string,
        query: string,
    ): Promise<Message[]> {
        const response = await axios.get(
            `${API_URL}/chat/messages/conversations/${conversationId}/search`,
            {
                params: { q: query },
                headers: getAuthHeaders(),
            },
        );
        return response.data;
    },

    async getUnreadCount(conversationId: string): Promise<number> {
        const response = await axios.get(
            `${API_URL}/chat/messages/conversations/${conversationId}/unread-count`,
            {
                headers: getAuthHeaders(),
            },
        );
        return response.data.count;
    },

    async getTotalUnreadCount(): Promise<number> {
        const response = await axios.get(
            `${API_URL}/chat/messages/unread-count/total`,
            {
                headers: getAuthHeaders(),
            },
        );
        return response.data.total;
    },
};