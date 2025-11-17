import React from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useMessages } from '../../hooks/useMessages';

interface ChatWindowProps {
    conversationId: string | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId }) => {
    const { messages, loading, sendMessage } = useMessages(conversationId);

    if (!conversationId) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                Select a conversation to start chatting
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                Loading messages...
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <MessageList messages={messages} />
            <MessageInput onSend={sendMessage} />
        </div>
    );
};
