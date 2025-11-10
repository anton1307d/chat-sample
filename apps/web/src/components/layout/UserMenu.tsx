import { useState } from 'react';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { Avatar } from '@components/ui/Avatar';

export const UserMenu = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
            >
                <Avatar
                    src={user?.avatarUrl}
                    alt={user?.displayName || user?.username || 'User'}
                    size="sm"
                    status={user?.status}
                />
                <span className="text-sm font-medium text-gray-700">
          {user?.displayName || user?.username}
        </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <div className="p-3 border-b border-gray-200">
                            <p className="text-sm font-medium text-gray-900">
                                {user?.displayName || user?.username}
                            </p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>

                        <div className="py-2">
                            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <User className="w-4 h-4" />
                                Profile
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>
                        </div>

                        <div className="border-t border-gray-200 py-2">
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};