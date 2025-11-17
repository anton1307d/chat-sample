import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';
import { Message } from '@/types';
import { messagesApi } from '@lib/api/messages';
import { useAuthStore } from '@lib/store/authStore';

export const useMessages = (conversationId: string | null) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const { socket, isConnected } = useSocket(conversationId);
    const { user } = useAuthStore();

    // Fetch existing messages when conversation changes
    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            try {
                setLoading(true);
                const response = await messagesApi.getMessages(conversationId);
                console.log('Fetched messages:', response.messages);
                setMessages(response.messages || []);
            } catch (error) {
                console.error('Error fetching messages:', error);
                setMessages([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [conversationId]);

    // Listen for new messages and confirmations via socket
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleNewMessage = (data: any) => {
            console.log('New message received:', data);

            // Transform backend data to match Message type
            const message: Message = {
                id: data.messageId,
                conversationId: data.conversationId,
                senderId: data.senderId,
                content: data.content,
                type: data.type as 'text' | 'image' | 'video' | 'audio' | 'file',
                metadata: data.metadata || {},
                sentAt: new Date(data.sentAt),
                readBy: [],
                isEdited: false,
                isDeleted: false,
                editedAt: null,
                deletedAt: null
            };

            setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m.id === message.id)) {
                    return prev;
                }
                return [...prev, message];
            });
        };

        const handleMessageConfirmed = (data: any) => {
            console.log('Message confirmed:', data);

            setMessages(prev =>
                prev.map(msg =>
                    msg.id === data.tempMessageId
                        ? {
                            ...msg,
                            id: data.realMessageId,
                            sentAt: new Date(data.sentAt)
                        }
                        : msg
                )
            );
        };

        socket.on('message:new', handleNewMessage);
        socket.on('message:confirmed', handleMessageConfirmed);

        return () => {
            socket.off('message:new', handleNewMessage);
            socket.off('message:confirmed', handleMessageConfirmed);
        };
    }, [socket, isConnected]);

    const sendMessage = async (content: string, type: 'text' | 'image' | 'video' | 'audio' | 'file' = 'text') => {
        if (!socket || !conversationId || !user) return;

        try {
            const tempMessageId = `temp:${Date.now()}:${crypto.randomUUID()}`;

            // Add optimistic message immediately
            const tempMessage: Message = {
                id: tempMessageId,
                conversationId,
                senderId: user.id,
                content,
                type,
                metadata: {},
                sentAt: new Date(),
                readBy: [],
                isEdited: false,
                isDeleted: false,
                editedAt: null,
                deletedAt: null
            };

            setMessages(prev => [...prev, tempMessage]);

            // Send to server
            socket.emit('message:send', {
                tempMessageId,
                conversationId,
                content,
                type
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return {
        messages,
        loading,
        sendMessage
    };
};




