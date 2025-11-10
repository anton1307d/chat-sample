import { useState } from 'react';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useConversations } from '@hooks/useConversations';
import toast from 'react-hot-toast';

interface CreateConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateConversationModal = ({
                                            isOpen,
                                            onClose,
                                        }: CreateConversationModalProps) => {
    const { createConversation } = useConversations();
    const [name, setName] = useState('');
    const [type, setType] = useState<'direct' | 'group' | 'channel'>('group');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error('Please enter a conversation name');
            return;
        }

        try {
            setIsLoading(true);
            await createConversation({
                type,
                name: name.trim(),
                participantIds: [], // Add user selection logic
            });

            toast.success('Conversation created!');
            setName('');
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create conversation');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Conversation">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                    </label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="direct">Direct Message</option>
                        <option value="group">Group</option>
                        <option value="channel">Channel</option>
                    </select>
                </div>

                <Input
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter conversation name"
                    disabled={isLoading}
                />

                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        isLoading={isLoading}
                        disabled={isLoading}
                    >
                        Create
                    </Button>
                </div>
            </form>
        </Modal>
    );
};