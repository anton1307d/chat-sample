import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

export const NavBar = () => {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Chats' },
        { path: '/contacts', label: 'Contacts' },
        { path: '/settings', label: 'Settings' },
    ];

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="px-6">
                <div className="flex gap-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                'py-4 border-b-2 transition-colors',
                                location.pathname === item.path
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
};