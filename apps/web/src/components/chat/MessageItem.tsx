import { useState } from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck, Edit2, Trash2 } from 'lucide-react';
import type { Message } from '@/types/message.types';
import { MessageReactions } from './MessageReactions';
// import { Avatar } from '@components/ui/Avatar';
import clsx from 'clsx';

interface MessageItemProps {
    message: Message;
    isOwnMessage: boolean;
}

export const MessageItem = ({ message, isOwnMessage }: MessageItemProps) => {
    const [showActions, setShowActions] = useState(false);

    const isRead = message.readBy.length > 1; // More than just sender
    const hasReactions = Object.keys(message.reactions || {}).length > 0;

    return (
        <div
            className={clsx(
                'flex items-end gap-2',
                isOwnMessage ? 'flex-row-reverse' : 'flex-row'
            )}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Avatar */}
            {/*{!isOwnMessage && (*/}
            {/*    <Avatar*/}
            {/*        src={message.senderAvatar}*/}
            {/*        alt={message.senderName}*/}
            {/*        size="sm"*/}
            {/*    />*/}
            {/*)}*/}

            {/* Message bubble */}
            <div
                className={clsx(
                    'max-w-md px-4 py-2 rounded-2xl relative',
                    isOwnMessage
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-900',
                    message.isDeleted && 'italic opacity-60'
                )}
            >
                {/* Message content */}
                <div className="break-words">{message.content}</div>

                {/* Edited indicator */}
                {message.isEdited && !message.isDeleted && (
                    <span className="text-xs opacity-70 ml-2">(edited)</span>
                )}

                {/* Sending/Error state */}
                {message.isSending && (
                    <div className="text-xs opacity-70 mt-1">Sending...</div>
                )}
                {message.sendError && (
                    <div className="text-xs text-red-300 mt-1">
                        Failed to send. Tap to retry.
                    </div>
                )}

                {/* Timestamp and read status */}
                <div
                    className={clsx(
                        'flex items-center gap-1 text-xs mt-1',
                        isOwnMessage ? 'text-white/70' : 'text-gray-500'
                    )}
                >
                    <span>{format(new Date(message.sentAt), 'HH:mm')}</span>

                    {isOwnMessage && (
                        <span>
              {isRead ? (
                  <CheckCheck className="w-4 h-4" />
              ) : (
                  <Check className="w-4 h-4" />
              )}
            </span>
                    )}
                </div>

                {/* Reactions */}
                {hasReactions && (
                    <MessageReactions
                        messageId={message.id}
                        reactions={message.reactions}
                    />
                )}

                {/* Actions menu */}
                {showActions && !message.isDeleted && (
                    <div
                        className={clsx(
                            'absolute top-0 flex items-center gap-1 bg-white shadow-lg rounded-lg p-1',
                            isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'
                        )}
                    >
                        <button
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Add reaction"
                        >
                            😊
                        </button>
                        {isOwnMessage && (
                            <>
                                <button
                                    className="p-1 hover:bg-gray-100 rounded"
                                    title="Edit"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    className="p-1 hover:bg-gray-100 rounded"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};