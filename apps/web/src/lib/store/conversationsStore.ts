import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Conversation } from '@/types/conversation.types';
import { conversationsApi } from '@lib/api/conversations';

interface ConversationsStore {
    conversations: Map<string, Conversation>;
    activeConversationId: string | null;
    isLoading: boolean;

    // Actions
    loadConversations: () => Promise<void>;
    addConversation: (conversation: Conversation) => void;
    updateConversation: (id: string, updates: Partial<Conversation>) => void;
    removeConversation: (id: string) => void;
    setActiveConversation: (id: string | null) => void;
    getConversation: (id: string) => Conversation | undefined;
    incrementUnreadCount: (id: string) => void;
    resetUnreadCount: (id: string) => void;
    updateLastMessage: (id: string, message: any) => void;
}

export const useConversationsStore = create<ConversationsStore>()(
    immer((set, get) => ({
        conversations: new Map(),
        activeConversationId: null,
        isLoading: false,

        loadConversations: async () => {
            try {
                set({ isLoading: true });
                const conversations = await conversationsApi.getAll();

                const conversationsMap = new Map<string, Conversation>();
                conversations.forEach((conv) => {
                    conversationsMap.set(conv.id, conv);
                });

                set({ conversations: conversationsMap, isLoading: false });
            } catch (error) {
                console.error('Failed to load conversations:', error);
                set({ isLoading: false });
            }
        },

        addConversation: (conversation) => {
            set((state) => {
                state.conversations.set(conversation.id, conversation);
            });
        },

        updateConversation: (id, updates) => {
            set((state) => {
                const conversation = state.conversations.get(id);
                if (conversation) {
                    state.conversations.set(id, { ...conversation, ...updates });
                }
            });
        },

        removeConversation: (id) => {
            set((state) => {
                state.conversations.delete(id);
                if (state.activeConversationId === id) {
                    state.activeConversationId = null;
                }
            });
        },

        setActiveConversation: (id) => {
            set({ activeConversationId: id });
        },

        getConversation: (id) => {
            return get().conversations.get(id);
        },

        incrementUnreadCount: (id) => {
            set((state) => {
                const conversation = state.conversations.get(id);
                if (conversation) {
                    conversation.unreadCount += 1;
                }
            });
        },

        resetUnreadCount: (id) => {
            set((state) => {
                const conversation = state.conversations.get(id);
                if (conversation) {
                    conversation.unreadCount = 0;
                }
            });
        },

        updateLastMessage: (id, message) => {
            set((state) => {
                const conversation = state.conversations.get(id);
                if (conversation) {
                    conversation.lastMessage = {
                        id: message.id,
                        content: message.content,
                        senderId: message.senderId,
                        sentAt: message.sentAt,
                    };
                }
            });
        },
    })),
);