export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    username: string;
    password: string;
    displayName?: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface User {
    id: string;
    email: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    status?: 'online' | 'away' | 'busy' | 'offline';
    statusMessage?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UserProfile extends User {
    bio?: string;
    phoneNumber?: string;
    timezone?: string;
    language?: string;
}