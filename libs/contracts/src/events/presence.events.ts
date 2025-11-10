export interface UserOnlineEvent {
    eventType: 'presence.online';
    userId: string;
    socketId: string;
    deviceId?: string;
    timestamp: Date;
}

export interface UserOfflineEvent {
    eventType: 'presence.offline';
    userId: string;
    socketId: string;
    deviceId?: string;
    lastSeen: Date;
}

export interface HeartbeatEvent {
    eventType: 'presence.heartbeat';
    userId: string;
    socketId: string;
    timestamp: Date;
}