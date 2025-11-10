import { useState } from 'react';
import clsx from 'clsx';

interface AvatarProps {
    src?: string;
    alt: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    status?: 'online' | 'away' | 'busy' | 'offline';
    className?: string;
}

export const Avatar = ({
                           src,
                           alt,
                           size = 'md',
                           status,
                           className
                       }: AvatarProps) => {
    const [imageError, setImageError] = useState(false);

    const sizes = {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-xl',
    };

    const statusColors = {
        online: 'bg-green-500',
        away: 'bg-yellow-500',
        busy: 'bg-red-500',
        offline: 'bg-gray-400',
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className={clsx('relative inline-block', className)}>
            {src && !imageError ? (
                <img
                    src={src}
                    alt={alt}
                    className={clsx(
                        'rounded-full object-cover',
                        sizes[size]
                    )}
                    onError={() => setImageError(true)}
                />
            ) : (
                <div
                    className={clsx(
                        'rounded-full bg-primary-500 text-white flex items-center justify-center font-semibold',
                        sizes[size]
                    )}
                >
                    {getInitials(alt)}
                </div>
            )}

            {status && (
                <span
                    className={clsx(
                        'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
                        statusColors[status],
                        size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'
                    )}
                />
            )}
        </div>
    );
};