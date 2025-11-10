import axios from 'axios';
import type { Conversation, CreateConversationDto } from '@/types/conversation.types';

// @ts-ignore
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
});

export const conversationsApi = {
    async getAll(): Promise<Conversation[]> {
        const response = await axios.get(`${API_URL}/chat/conversations`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    async getById(id: string): Promise<Conversation> {
        const response = await axios.get(`${API_URL}/chat/conversations/${id}`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    async create(data: CreateConversationDto): Promise<Conversation> {
        const response = await axios.post(
            `${API_URL}/chat/conversations`,
            data,
            {
                headers: getAuthHeaders(),
            },
        );
        return response.data;
    },

    async update(id: string, data: Partial<Conversation>): Promise<Conversation> {
        const response = await axios.patch(
            `${API_URL}/chat/conversations/${id}`,
            data,
            {
                headers: getAuthHeaders(),
            },
        );
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await axios.delete(`${API_URL}/chat/conversations/${id}`, {
            headers: getAuthHeaders(),
        });
    },

    async addParticipant(conversationId: string, userId: string): Promise<void> {
        await axios.post(
            `${API_URL}/chat/conversations/${conversationId}/participants`,
            { userId },
            {
                headers: getAuthHeaders(),
            },
        );
    },

    async removeParticipant(conversationId: string, userId: string): Promise<void> {
        await axios.delete(
            `${API_URL}/chat/conversations/${conversationId}/participants/${userId}`,
            {
                headers: getAuthHeaders(),
            },
        );
    },
};