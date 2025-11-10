import { format } from 'date-fns';
import clsx from 'clsx';
import { Avatar } from '@components/ui/Avatar.tsx';
import { Badge } from '@components/ui/Badge.tsx';
import type { Conversation } from '@/types/conversation.types.ts';

interface ConversationItemProps {
    conversation: Conversation;
    isActive: boolean;
    onClick: () => void;
}

export const ConversationItem = ({
                                     conversation,
                                     isActive,
                                     onClick,
                                 }: ConversationItemProps) => {
    const lastMessage = conversation.lastMessage;
    const hasUnread = conversation.unreadCount > 0;

    return (
        <div
            onClick={onClick}
            className={clsx(
                'p-4 cursor-pointer transition-colors hover:bg-gray-50',
                isActive && 'bg-primary-50 hover:bg-primary-50'
            )}
        >
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <Avatar
                    src={conversation.avatarUrl}
                    alt={conversation.name || 'Conversation'}
                    size="md"
                    status={conversation.participants[0]?.status}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h3
                            className={clsx(
                                'text-sm truncate',
                                hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                            )}
                        >
                            {conversation.name || 'Unnamed Conversation'}
                        </h3>

                        {lastMessage && (
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {format(new Date(lastMessage.sentAt), 'HH:mm')}
              </span>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        {lastMessage && (
                            <p
                                className={clsx(
                                    'text-sm truncate',
                                    hasUnread ? 'font-medium text-gray-900' : 'text-gray-500'
                                )}
                            >
                                {lastMessage.content}
                            </p>
                        )}

                        {hasUnread && (
                            <Badge variant="success" size="sm" className="ml-2 flex-shrink-0">
                                {conversation.unreadCount}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};