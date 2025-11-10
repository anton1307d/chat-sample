// apps/web/src/lib/utils/format.ts

import { format, formatDistanceToNow } from 'date-fns';

export const formatMessageTime = (date: string | Date): string => {
    return format(new Date(date), 'HH:mm');
};

export const formatMessageDate = (date: string | Date): string => {
    return format(new Date(date), 'MMM d, yyyy');
};

export const formatRelativeTime = (date: string | Date): string => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};