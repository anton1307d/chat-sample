import { MessageSquare, Users, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@hooks/useAuth.ts';

export const Sidebar = () => {
    const { logout } = useAuth();

    const menuItems = [
        { icon: MessageSquare, label: 'Messages', path: '/' },
        { icon: Users, label: 'Contacts', path: '/contacts' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <aside className="w-16 bg-primary-600 flex flex-col items-center py-4">
            {/* Logo */}
            <div className="mb-8">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-primary-600" />
                </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 flex flex-col gap-2">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        className="w-12 h-12 flex items-center justify-center text-white hover:bg-primary-700 rounded-lg transition-colors"
                        title={item.label}
                    >
                        <item.icon className="w-6 h-6" />
                    </button>
                ))}
            </nav>

            {/* Logout */}
            <button
                onClick={logout}
                className="w-12 h-12 flex items-center justify-center text-white hover:bg-primary-700 rounded-lg transition-colors"
                title="Logout"
            >
                <LogOut className="w-6 h-6" />
            </button>
        </aside>
    );
};