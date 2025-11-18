export interface ConnectionMetadata {
    userId: string;
    connectionId: string;
    serverId: string;
    connectedAt: string;
    userAgent?: string;
    ip?: string;
}

export interface ConnectionStats {
    serverId: string;
    totalConnections: number;
    onlineUsers: number;
    currentServerConnections: number;
    timestamp: string;
}