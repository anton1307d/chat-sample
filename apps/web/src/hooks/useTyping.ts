import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from './useSocket.ts';

export const useTyping = (conversationId: string) => {
    const { emit } = useSocket();
    const typingTimeoutRef = useRef<NodeJS.Timeout>();

    const sendTypingStart = useCallback(() => {
        emit('typing:start', { conversationId });
    }, [conversationId, emit]);

    const sendTypingStop = useCallback(() => {
        emit('typing:stop', { conversationId });
    }, [conversationId, emit]);

    const handleTyping = useCallback(() => {
        // Send typing start
        sendTypingStart();

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Send typing stop after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            sendTypingStop();
        }, 3000);
    }, [sendTypingStart, sendTypingStop]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                sendTypingStop();
            }
        };
    }, [sendTypingStop]);

    return {
        handleTyping,
        sendTypingStart,
        sendTypingStop,
    };
};