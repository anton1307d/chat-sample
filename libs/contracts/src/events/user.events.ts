export interface UserRegisteredEvent {
    eventType: 'user.registered';
    userId: string;
    username: string;
    email: string;
    registeredAt: Date;
}

export interface UserUpdatedEvent {
    eventType: 'user.updated';
    userId: string;
    changes: {
        displayName?: string;
        profilePictureUrl?: string;
    };
    updatedAt: Date;
}

export interface UserDeletedEvent {
    eventType: 'user.deleted';
    userId: string;
    deletedAt: Date;
}