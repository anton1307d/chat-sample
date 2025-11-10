import { useEffect, useRef } from 'react';
import { useMessages } from '@hooks/useMessages';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { Loader2 } from 'lucide-react';

interface ChatWindowProps {
    conversationId: string;
}

export const ChatWindow = ({ conversationId }: ChatWindowProps) => {
    const {
        messages,
        isLoading,
        hasMore,
        isTyping,
        sendMessage,
        loadMore,
        markAsRead,
    } = useMessages(conversationId);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mark messages as read when conversation is opened
    useEffect(() => {
        markAsRead();
    }, [conversationId]);

    return (
        <div className="flex flex-col h-full">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                {isLoading && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : (
                    <>
                        {hasMore && (
                            <div className="text-center py-4">
                                <button
                                    onClick={loadMore}
                                    className="text-sm text-primary-600 hover:text-primary-700"
                                >
                                    Load more messages
                                </button>
                            </div>
                        )}

                        <MessageList messages={messages} />

                        {isTyping.length > 0 && <TypingIndicator userIds={isTyping} />}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 px-4 py-4">
                <MessageInput
                    onSend={sendMessage}
                    conversationId={conversationId}
                />
            </div>
        </div>
    );
};