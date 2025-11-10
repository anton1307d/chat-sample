export interface StatusUpdateEvent {
    eventType: 'status.update';
    messageId: string;
    senderId: string;
    status: 'sent' | 'delivered' | 'read';
    timestamp: Date;
}