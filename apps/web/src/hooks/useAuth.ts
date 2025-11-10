import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@lib/store/authStore';
import { socketService } from '@lib/socket/socket';

export const useAuth = () => {
    const navigate = useNavigate();
    const {
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        loadUser,
        updateUser,
    } = useAuthStore();

    useEffect(() => {
        // Load user on mount if token exists
        const token = localStorage.getItem('accessToken');
        if (token && !user) {
            loadUser();
        }
    }, []);

    const handleLogin = async (email: string, password: string) => {
        await login(email, password);

        // Connect socket after login
        const token = localStorage.getItem('accessToken');
        if (token) {
            socketService.connect(token);
        }

        navigate('/');
    };

    const handleRegister = async (
        email: string,
        username: string,
        password: string,
    ) => {
        await register(email, username, password);

        // Connect socket after registration
        const token = localStorage.getItem('accessToken');
        if (token) {
            socketService.connect(token);
        }

        navigate('/');
    };

    const handleLogout = async () => {
        await logout();
        socketService.disconnect();
        navigate('/login');
    };

    return {
        user,
        isAuthenticated,
        isLoading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        updateUser,
    };
};