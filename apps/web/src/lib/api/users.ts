import axios from 'axios';
import type { User } from '@/types/auth.types';


// @ts-ignore
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
});

export const usersApi = {
    async searchUsers(query: string): Promise<User[]> {
        const response = await axios.get(`${API_URL}/users/search`, {
            params: { q: query },
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    async getUserById(id: string): Promise<User> {
        const response = await axios.get(`${API_URL}/users/${id}`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    },

    async updateProfile(updates: Partial<User>): Promise<User> {
        const response = await axios.patch(
            `${API_URL}/users/profile`,
            updates,
            {
                headers: getAuthHeaders(),
            },
        );
        return response.data;
    },

    async updateStatus(status: 'online' | 'away' | 'busy' | 'offline'): Promise<void> {
        await axios.patch(
            `${API_URL}/users/status`,
            { status },
            {
                headers: getAuthHeaders(),
            },
        );
    },
};