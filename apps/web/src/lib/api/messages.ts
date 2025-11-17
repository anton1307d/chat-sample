import axios from 'axios';
import type { Message } from '@/types/message.types';

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
        // Mocked response for now
        const response = await axios.get(
            `${API_URL}/chat/messages/conversation/${conversationId}`,
            {
                headers: getAuthHeaders(),
                params: {
                    limit,
                    ...(before && { before }),
                },
            },
        );

        return {
            messages: response.data.messages || [],
            hasMore: false, // Mock for now
            nextCursor: undefined, // Mock for now
        };
    },
};