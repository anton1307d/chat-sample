export interface Conversation {
    id: string;
    type: 'direct' | 'group' | 'channel';
    name?: string;
    description?: string;
    avatarUrl?: string;
    participants: ConversationParticipant[];
    lastMessage?: {
        id: string;
        content: string;
        senderId: string;
        sentAt: string;
    };
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationParticipant {
    userId: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    status?: 'online' | 'away' | 'busy' | 'offline';
    role?: 'admin' | 'member';
    joinedAt: string;
}

export interface CreateConversationDto {
    type: 'direct' | 'group' | 'channel';
    name?: string;
    description?: string;
    participantIds: string[];
}