export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'file';
    metadata?: {
        fileName?: string;
        fileSize?: number;
        mimeType?: string;
        duration?: number;
        dimensions?: { width: number; height: number };
        thumbnail?: string;
    };
    readBy: string[];
    sentAt: string;
    deliveredAt?: string;
    editedAt?: string;
    isEdited: boolean;
    isDeleted: boolean;
    replyTo?: string;
    mentions: string[];
    attachments: string[];
    reactions: {
        [emoji: string]: string[];
    };
    // Client-side only
    isOptimistic?: boolean;
    isSending?: boolean;
    sendError?: string;
}

export interface SendMessageDto {
    conversationId: string;
    content: string;
    type?: 'text' | 'image' | 'video' | 'audio' | 'file';
    metadata?: any;
    replyTo?: string;
    mentions?: string[];
    attachments?: string[];
}