import { useEffect, useState, useCallback } from 'react';
import { useMessagesStore } from '@lib/store/messagesStore';
import { useConversationsStore } from '@lib/store/conversationsStore';
import { useSocket } from './useSocket.ts';
import { useAuthStore } from '@lib/store/authStore';
import type { Message } from '@/types/message.types';
import { messagesApi } from '@lib/api/messages';

export const useMessages = (conversationId: string) => {
    const { user } = useAuthStore();
    const { on, off, emit } = useSocket();
    const [isTyping, setIsTyping] = useState<Set<string>>(new Set());

    const {
        messages: allMessages,
        isLoading,
        hasMore,
        loadMessages,
        addMessage,
        updateMessage,
        addOptimisticMessage,
        confirmOptimisticMessage,
        failOptimisticMessage,
    } = useMessagesStore();

    const {
        updateLastMessage,
        incrementUnreadCount,
        resetUnreadCount,
        activeConversationId,
    } = useConversationsStore();

    const messages = allMessages.get(conversationId) || [];

    // Load messages on mount
    useEffect(() => {
        if (conversationId) {
            loadMessages(conversationId);
        }
    }, [conversationId]);

    // Socket event listeners
    useEffect(() => {
        if (!conversationId) return;

        // New message received
        const handleNewMessage = (message: Message) => {
            if (message.conversationId === conversationId) {
                addMessage(conversationId, message);
                updateLastMessage(conversationId, message);

                // Increment unread if not active conversation
                if (message.senderId !== user?.id && activeConversationId !== conversationId) {
                    incrementUnreadCount(conversationId);
                }

                // Auto mark as read if active
                if (activeConversationId === conversationId && message.senderId !== user?.id) {
                    messagesApi.markAsRead(message.id);
                }
            }
        };

        // Message confirmed (after optimistic send)
        const handleMessageConfirmed = (data: {
            tempMessageId: string;
            messageId: string;
            conversationId: string;
            sentAt: string;
        }) => {
            if (data.conversationId === conversationId) {
                const tempMessage = messages.find((m) => m.id === data.tempMessageId);
                if (tempMessage) {
                    confirmOptimisticMessage(conversationId, data.tempMessageId, {
                        ...tempMessage,
                        id: data.messageId,
                        sentAt: data.sentAt,
                    });
                }
            }
        };

        // Message error
        const handleMessageError = (data: {
            tempMessageId: string;
            error: string;
        }) => {
            failOptimisticMessage(conversationId, data.tempMessageId, data.error);
        };

        // Message edited
        const handleMessageEdited = (data: {
            messageId: string;
            conversationId: string;
            newContent: string;
            editedAt: string;
        }) => {
            if (data.conversationId === conversationId) {
                updateMessage(conversationId, data.messageId, {
                    content: data.newContent,
                    isEdited: true,
                    editedAt: data.editedAt,
                });
            }
        };

        // Message deleted
        const handleMessageDeleted = (data: {
            messageId: string;
            conversationId: string;
        }) => {
            if (data.conversationId === conversationId) {
                updateMessage(conversationId, data.messageId, {
                    isDeleted: true,
                    content: '[Message deleted]',
                });
            }
        };

        // Typing indicators
        const handleTypingStart = (data: { userId: string; conversationId: string }) => {
            if (data.conversationId === conversationId && data.userId !== user?.id) {
                setIsTyping((prev) => new Set(prev).add(data.userId));
            }
        };

        const handleTypingStop = (data: { userId: string; conversationId: string }) => {
            if (data.conversationId === conversationId) {
                setIsTyping((prev) => {
                    const next = new Set(prev);
                    next.delete(data.userId);
                    return next;
                });
            }
        };

        // Reaction events
        const handleReactionAdded = (data: {
            messageId: string;
            conversationId: string;
            userId: string;
            emoji: string;
        }) => {
            if (data.conversationId === conversationId) {
                const message = messages.find((m) => m.id === data.messageId);
                if (message) {
                    const reactions = { ...message.reactions };
                    if (!reactions[data.emoji]) {
                        reactions[data.emoji] = [];
                    }
                    if (!reactions[data.emoji].includes(data.userId)) {
                        reactions[data.emoji].push(data.userId);
                    }
                    updateMessage(conversationId, data.messageId, { reactions });
                }
            }
        };

        // Register all listeners
        on('message:new', handleNewMessage);
        on('message:confirmed', handleMessageConfirmed);
        on('message:error', handleMessageError);
        on('message:edited', handleMessageEdited);
        on('message:deleted', handleMessageDeleted);
        on('typing:start', handleTypingStart);
        on('typing:stop', handleTypingStop);
        on('reaction:added', handleReactionAdded);

        // Cleanup
        return () => {
            off('message:new', handleNewMessage);
            off('message:confirmed', handleMessageConfirmed);
            off('message:error', handleMessageError);
            off('message:edited', handleMessageEdited);
            off('message:deleted', handleMessageDeleted);
            off('typing:start', handleTypingStart);
            off('typing:stop', handleTypingStop);
            off('reaction:added', handleReactionAdded);
        };
    }, [conversationId, messages, user, activeConversationId]);

    // Send message
    const sendMessage = useCallback(
        (content: string) => {
            if (!user) return;

            const tempId = `temp-${Date.now()}`;
            const optimisticMessage: Message = {
                id: tempId,
                conversationId,
                senderId: user.id,
                content,
                type: 'text',
                metadata: {},
                readBy: [user.id],
                sentAt: new Date().toISOString(),
                isEdited: false,
                isDeleted: false,
                mentions: [],
                attachments: [],
                reactions: {},
                isOptimistic: true,
                isSending: true,
            };

            // Add optimistic message immediately
            addOptimisticMessage(conversationId, optimisticMessage);

            // Send via WebSocket
            emit(
                'message:send',
                {
                    conversationId,
                    content,
                    type: 'text',
                },
                (response: { success: boolean; messageId?: string; error?: string }) => {
                    if (!response.success) {
                        failOptimisticMessage(
                            conversationId,
                            tempId,
                            response.error || 'Failed to send',
                        );
                    }
                },
            );
        },
        [conversationId, user, emit],
    );

    // Edit message
    const editMessage = useCallback(
        async (messageId: string, content: string) => {
            try {
                await messagesApi.editMessage(messageId, content);
            } catch (error) {
                console.error('Failed to edit message:', error);
                throw error;
            }
        },
        [],
    );

    // Delete message
    const deleteMessage = useCallback(
        async (messageId: string) => {
            try {
                await messagesApi.deleteMessage(messageId);
            } catch (error) {
                console.error('Failed to delete message:', error);
                throw error;
            }
        },
        [],
    );

    // Add reaction
    const addReaction = useCallback(
        async (messageId: string, emoji: string) => {
            try {
                await messagesApi.addReaction(messageId, emoji);
            } catch (error) {
                console.error('Failed to add reaction:', error);
                throw error;
            }
        },
        [],
    );

    // Load more messages
    const loadMore = useCallback(() => {
        const oldestMessage = messages[messages.length - 1];
        if (oldestMessage && hasMore.get(conversationId)) {
            loadMessages(conversationId, oldestMessage.id);
        }
    }, [conversationId, messages, hasMore]);

    // Mark as read
    const markAsRead = useCallback(() => {
        messagesApi.markConversationAsRead(conversationId);
        resetUnreadCount(conversationId);
    }, [conversationId]);

    return {
        messages,
        isLoading: isLoading.get(conversationId) || false,
        hasMore: hasMore.get(conversationId) || false,
        isTyping: Array.from(isTyping),
        sendMessage,
        editMessage,
        deleteMessage,
        addReaction,
        loadMore,
        markAsRead,
    };
};