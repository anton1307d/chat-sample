import { useEffect, useRef } from 'react';
import { socketService } from '@lib/socket/socket';
import { useAuthStore } from '@lib/store/authStore';

export const useSocket = (conversationId?: string | null) => {
    const { accessToken, isAuthenticated } = useAuthStore();
    const isConnected = useRef(false);
    const currentConversation = useRef<string | null>(null);

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

    useEffect(() => {
        const socket = socketService.getSocket();
        if (!socket || !socketService.isConnected() || !conversationId) return;

        if (currentConversation.current && currentConversation.current !== conversationId) {
            socket.emit('conversation:leave', {
                conversationId: currentConversation.current
            });
        }

        socket.emit('conversation:join', { conversationId });
        currentConversation.current = conversationId;

        return () => {
            if (currentConversation.current) {
                socket.emit('conversation:leave', {
                    conversationId: currentConversation.current
                });
                currentConversation.current = null;
            }
        };
    }, [conversationId]);

    return {
        socket: socketService.getSocket(),
        isConnected: socketService.isConnected(),
        emit: socketService.emit.bind(socketService),
        on: socketService.on.bind(socketService),
        off: socketService.off.bind(socketService),
    };
};
