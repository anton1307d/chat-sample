import axios from 'axios';
import type {
    LoginCredentials,
    RegisterCredentials,
    AuthResponse,
    User
} from '@/types/auth.types';

// @ts-ignore
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const authApi = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await axios.post(`${API_URL}/auth/login`, credentials);
        return response.data;
    },

    async register(credentials: RegisterCredentials): Promise<AuthResponse> {
        const response = await axios.post(`${API_URL}/auth/register`, credentials);
        return response.data;
    },

    async logout(): Promise<void> {
        const token = localStorage.getItem('accessToken');
        await axios.post(
            `${API_URL}/auth/logout`,
            {},
            {
                headers: { Authorization: `Bearer ${token}` },
            },
        );
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    },

    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
        });
        return response.data;
    },

    async getCurrentUser(): Promise<User> {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },
};