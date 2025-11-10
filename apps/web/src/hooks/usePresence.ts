import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useAuthStore } from '@lib/store/authStore';

export const usePresence = () => {
    const { on, off, emit } = useSocket();
    const { user, updateUser } = useAuthStore();

    useEffect(() => {
        if (!user) return;

        // Emit online status when connected
        emit('presence:online', { userId: user.id });

        // Listen for presence updates
        const handlePresenceUpdate = (data: {
            userId: string;
            status: 'online' | 'away' | 'busy' | 'offline';
        }) => {
            if (data.userId === user.id) {
                updateUser({ status: data.status });
            }
        };

        on('presence:update', handlePresenceUpdate);

        // Send heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => {
            emit('presence:heartbeat', { userId: user.id });
        }, 30000);

        return () => {
            off('presence:update', handlePresenceUpdate);
            clearInterval(heartbeatInterval);
            emit('presence:offline', { userId: user.id });
        };
    }, [user, emit, on, off, updateUser]);

    const setStatus = (status: 'online' | 'away' | 'busy' | 'offline') => {
        emit('presence:status', { status });
        updateUser({ status });
    };

    return {
        status: user?.status || 'offline',
        setStatus,
    };
};