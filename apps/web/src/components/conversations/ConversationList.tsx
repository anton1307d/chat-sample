import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { ConversationItem } from './ConversationItem.tsx';
import { CreateConversationModal } from './CreateConversationModal';
import { Button } from '@components/ui/Button.tsx';
import { Input } from '@components/ui/Input.tsx';
import type { Conversation } from '@/types/conversation.types.ts';

interface ConversationListProps {
    conversations: Conversation[];
    activeId?: string;
    onSelect: (id: string) => void;
}

export const ConversationList = ({
                                     conversations,
                                     activeId,
                                     onSelect,
                                 }: ConversationListProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const filteredConversations = conversations.filter((conv) =>
        conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
                    <Button
                        size="sm"
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        New
                    </Button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
                        <p className="text-sm text-center">
                            {searchQuery
                                ? 'No conversations found'
                                : 'No conversations yet. Start a new one!'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredConversations.map((conversation) => (
                            <ConversationItem
                                key={conversation.id}
                                conversation={conversation}
                                isActive={conversation.id === activeId}
                                onClick={() => onSelect(conversation.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create Conversation Modal */}
            <CreateConversationModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </div>
    );
};