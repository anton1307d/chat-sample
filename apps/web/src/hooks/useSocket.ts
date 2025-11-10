import { useEffect, useRef } from 'react';
import { socketService } from '@lib/socket/socket';
import { useAuthStore } from '@lib/store/authStore';

export const useSocket = () => {
    const { accessToken, isAuthenticated } = useAuthStore();
    const isConnected = useRef(false);

    useEffect(() => {
        if (isAuthenticated && accessToken && !isConnected.current) {
            socketService.connect(accessToken);
            isConnected.current = true;
        }

        return () => {
            if (isConnected.current) {
                socketService.disconnect();
                isConnected.current = false;
            }
        };
    }, [isAuthenticated, accessToken]);

    return {
        socket: socketService.getSocket(),
        isConnected: socketService.isConnected(),
        emit: socketService.emit.bind(socketService),
        on: socketService.on.bind(socketService),
        off: socketService.off.bind(socketService),
    };
};