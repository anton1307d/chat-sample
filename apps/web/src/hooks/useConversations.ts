import { useEffect } from 'react';
import { useConversationsStore } from '@lib/store/conversationsStore';
import { conversationsApi } from '@lib/api/conversations';
import type { CreateConversationDto } from '@/types/conversation.types';

export const useConversations = () => {
    const {
        conversations,
        activeConversationId,
        isLoading,
        loadConversations,
        addConversation,
        removeConversation,
        setActiveConversation,
        getConversation,
    } = useConversationsStore();

    // Load conversations on mount
    useEffect(() => {
        loadConversations();
    }, []);

    const createConversation = async (data: CreateConversationDto) => {
        try {
            const conversation = await conversationsApi.create(data);
            addConversation(conversation);
            return conversation;
        } catch (error) {
            console.error('Failed to create conversation:', error);
            throw error;
        }
    };

    const deleteConversation = async (id: string) => {
        try {
            await conversationsApi.delete(id);
            removeConversation(id);
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            throw error;
        }
    };

    const conversationsList = Array.from(conversations.values()).sort((a, b) => {
        const aTime = a.lastMessage?.sentAt || a.updatedAt;
        const bTime = b.lastMessage?.sentAt || b.updatedAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    const activeConversation = activeConversationId
        ? getConversation(activeConversationId)
        : null;

    return {
        conversations: conversationsList,
        activeConversation,
        isLoading,
        createConversation,
        deleteConversation,
        setActiveConversation,
        getConversation,
    };
};