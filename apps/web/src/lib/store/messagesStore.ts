import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Message } from '@/types/message.types';
import { messagesApi } from '@lib/api/messages';

interface MessagesStore {
    messages: Map<string, Message[]>; // conversationId -> messages[]
    isLoading: Map<string, boolean>;
    hasMore: Map<string, boolean>;

    // Actions
    loadMessages: (conversationId: string, before?: string) => Promise<void>;
    addMessage: (conversationId: string, message: Message) => void;
    updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
    removeMessage: (conversationId: string, messageId: string) => void;
    clearMessages: (conversationId: string) => void;
    addOptimisticMessage: (conversationId: string, message: Message) => void;
    confirmOptimisticMessage: (conversationId: string, tempId: string, realMessage: Message) => void;
    failOptimisticMessage: (conversationId: string, tempId: string, error: string) => void;
}

export const useMessagesStore = create<MessagesStore>()(
    immer((set) => ({
        messages: new Map(),
        isLoading: new Map(),
        hasMore: new Map(),

        loadMessages: async (conversationId, before) => {
            try {
                set((state) => {
                    state.isLoading.set(conversationId, true);
                });

                const response = await messagesApi.getMessages(conversationId, 50, before);

                set((state) => {
                    const existing = state.messages.get(conversationId) || [];

                    if (before) {
                        // Append older messages
                        state.messages.set(conversationId, [
                            ...existing,
                            ...response.messages,
                        ]);
                    } else {
                        // Initial load or refresh
                        state.messages.set(conversationId, response.messages);
                    }

                    state.hasMore.set(conversationId, response.hasMore);
                    state.isLoading.set(conversationId, false);
                });
            } catch (error) {
                console.error('Failed to load messages:', error);
                set((state) => {
                    state.isLoading.set(conversationId, false);
                });
            }
        },

        addMessage: (conversationId, message) => {
            set((state) => {
                const messages = state.messages.get(conversationId) || [];

                // Check if message already exists
                const exists = messages.some((m) => m.id === message.id);
                if (!exists) {
                    state.messages.set(conversationId, [message, ...messages]);
                }
            });
        },

        updateMessage: (conversationId, messageId, updates) => {
            set((state) => {
                const messages = state.messages.get(conversationId);
                if (messages) {
                    const index = messages.findIndex((m) => m.id === messageId);
                    if (index !== -1) {
                        messages[index] = { ...messages[index], ...updates };
                    }
                }
            });
        },

        removeMessage: (conversationId, messageId) => {
            set((state) => {
                const messages = state.messages.get(conversationId);
                if (messages) {
                    state.messages.set(
                        conversationId,
                        messages.filter((m) => m.id !== messageId),
                    );
                }
            });
        },

        clearMessages: (conversationId) => {
            set((state) => {
                state.messages.delete(conversationId);
                state.isLoading.delete(conversationId);
                state.hasMore.delete(conversationId);
            });
        },

        addOptimisticMessage: (conversationId, message) => {
            set((state) => {
                const messages = state.messages.get(conversationId) || [];
                state.messages.set(conversationId, [
                    { ...message, isOptimistic: true, isSending: true },
                    ...messages,
                ]);
            });
        },

        confirmOptimisticMessage: (conversationId, tempId, realMessage) => {
            set((state) => {
                const messages = state.messages.get(conversationId);
                if (messages) {
                    const index = messages.findIndex((m) => m.id === tempId);
                    if (index !== -1) {
                        messages[index] = {
                            ...realMessage,
                            isOptimistic: false,
                            isSending: false,
                        };
                    }
                }
            });
        },

        failOptimisticMessage: (conversationId, tempId, error) => {
            set((state) => {
                const messages = state.messages.get(conversationId);
                if (messages) {
                    const index = messages.findIndex((m) => m.id === tempId);
                    if (index !== -1) {
                        messages[index] = {
                            ...messages[index],
                            isSending: false,
                            sendError: error,
                        };
                    }
                }
            });
        },
    })),
);