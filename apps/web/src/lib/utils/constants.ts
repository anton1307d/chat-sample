// apps/web/src/lib/utils/constants.ts

// @ts-ignore
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
// @ts-ignore
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002';
// @ts-ignore
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Chat App';

export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER: 'user',
} as const;

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    CONVERSATION: (id: string) => `/conversations/${id}`,
} as const;

export const MESSAGE_MAX_LENGTH = 10000;
export const USERNAME_MIN_LENGTH = 3;
export const PASSWORD_MIN_LENGTH = 6;