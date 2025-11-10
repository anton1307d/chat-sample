import { MessageItem } from './MessageItem';
import type { Message } from '@/types/message.types';
import { useAuthStore } from '@lib/store/authStore';
import { formatDistanceToNow } from 'date-fns';

interface MessageListProps {
    messages: Message[];
}

export const MessageList = ({ messages }: MessageListProps) => {
    const { user } = useAuthStore();

    const groupMessagesByDate = (messages: Message[]) => {
        const groups: { [date: string]: Message[] } = {};

        messages.forEach((message) => {
            const date = new Date(message.sentAt).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
        });

        return groups;
    };

    const messageGroups = groupMessagesByDate(messages);

    return (
        <div className="space-y-6">
            {Object.entries(messageGroups).map(([date, messages]) => (
                <div key={date}>
                    {/* Date divider */}
                    <div className="flex items-center justify-center my-4">
                        <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                            {formatDistanceToNow(new Date(date), { addSuffix: true })}
                        </div>
                    </div>

                    {/* Messages for this date */}
                    <div className="space-y-2">
                        {messages.map((message) => (
                            <MessageItem
                                key={message.id}
                                message={message}
                                isOwnMessage={message.senderId === user?.id}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};