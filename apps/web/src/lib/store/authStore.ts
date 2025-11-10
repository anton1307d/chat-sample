import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/auth.types';
import { authApi } from '@lib/api/auth';

interface AuthStore {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setUser: (user: User | null) => void;
    setTokens: (accessToken: string, refreshToken: string) => void;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loadUser: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,

            setUser: (user) => set({
                user,
                isAuthenticated: user !== null
            }),

            setTokens: (accessToken, refreshToken) => {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                set({ accessToken, refreshToken });
            },

            login: async (email, password) => {
                try {
                    set({ isLoading: true });
                    const response = await authApi.login({ email, password });

                    get().setTokens(response.accessToken, response.refreshToken);
                    set({
                        user: response.user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ isLoading: false });
                    throw new Error(error.response?.data?.message || 'Login failed');
                }
            },

            register: async (email, username, password) => {
                try {
                    set({ isLoading: true });
                    const response = await authApi.register({
                        email,
                        username,
                        password
                    });

                    get().setTokens(response.accessToken, response.refreshToken);
                    set({
                        user: response.user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error: any) {
                    set({ isLoading: false });
                    throw new Error(error.response?.data?.message || 'Registration failed');
                }
            },

            logout: async () => {
                try {
                    await authApi.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false,
                    });
                }
            },

            loadUser: async () => {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    set({ isAuthenticated: false });
                    return;
                }

                try {
                    set({ isLoading: true });
                    const user = await authApi.getCurrentUser();
                    set({
                        user,
                        accessToken: token,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                    localStorage.removeItem('accessToken');
                }
            },

            updateUser: (updates) => {
                const { user } = get();
                if (user) {
                    set({ user: { ...user, ...updates } });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        },
    ),
);