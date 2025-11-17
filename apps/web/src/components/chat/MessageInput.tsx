import React, { useState } from 'react';

interface MessageInputProps {
    onSend: (content: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSend }) => {
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
            onSend(content.trim());
            setContent('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                />
                <button
                    type="submit"
                    disabled={!content.trim()}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                >
                    Send
                </button>
            </div>
        </form>
    );
};
