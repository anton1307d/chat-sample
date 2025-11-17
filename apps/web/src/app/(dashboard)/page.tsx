import { useParams, useNavigate } from 'react-router-dom';
import { ConversationList } from '@components/conversations/ConversationList';
import { ChatWindow } from '@components/chat/ChatWindow';
import { useConversations } from '@hooks/useConversations';

export default function HomePage() {
    const { conversationId } = useParams<{ conversationId: string }>();
    const { conversations, setActiveConversation } = useConversations();
    const navigate = useNavigate();
    const handleSelectConversation = (id: string) => {
        setActiveConversation(id);
        navigate(`/conversations/${id}`);
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar with conversations */}
            <div className="w-80 border-r border-gray-200 bg-white">
                <ConversationList
                    conversations={conversations}
                    activeId={conversationId}
                    onSelect={handleSelectConversation}
                />
            </div>

            {/* Chat area */}
            <div className="flex-1 bg-gray-50">
                {conversationId ? (
                    <ChatWindow conversationId={conversationId} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Select as conversation to start chatting
                    </div>
                )}
            </div>
        </div>
    );
}