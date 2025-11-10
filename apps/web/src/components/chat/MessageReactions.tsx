interface MessageReactionsProps {
    messageId: string;
    reactions: { [emoji: string]: string[] };
}

export const MessageReactions = ({ reactions }: MessageReactionsProps) => {
    if (!reactions || Object.keys(reactions).length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(reactions).map(([emoji, userIds]) => (
                <button
                    key={emoji}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-full text-sm hover:bg-gray-50 transition-colors"
                    onClick={() => {
                        // Handle reaction toggle
                    }}
                >
                    <span>{emoji}</span>
                    <span className="text-gray-600 text-xs">{userIds.length}</span>
                </button>
            ))}
        </div>
    );
};