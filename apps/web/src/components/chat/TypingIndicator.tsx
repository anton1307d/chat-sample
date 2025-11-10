interface TypingIndicatorProps {
    userIds: string[];
}

export const TypingIndicator = ({ userIds }: TypingIndicatorProps) => {
    if (userIds.length === 0) return null;

    return (
        <div className="flex items-center gap-2 py-2">
            <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-gray-500">
        {userIds.length === 1 ? 'Someone is' : `${userIds.length} people are`} typing...
      </span>
        </div>
    );
};