import { useState } from 'react';
import { Send } from 'lucide-react';
import { useTyping } from '@hooks/useTyping';
import { Button } from '@components/ui/Button';

interface MessageInputProps {
    onSend: (content: string) => void;
    conversationId: string;
}

export const MessageInput = ({ onSend, conversationId }: MessageInputProps) => {
    const [message, setMessage] = useState('');
    const { handleTyping } = useTyping(conversationId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (message.trim()) {
            onSend(message.trim());
            setMessage('');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        handleTyping();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          style={{ minHeight: '44px', maxHeight: '200px' }}
      />

            <Button
                type="submit"
                disabled={!message.trim()}
                className="flex-shrink-0"
            >
                <Send className="w-5 h-5" />
            </Button>
        </form>
    );
};