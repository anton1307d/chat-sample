import { io, Socket } from 'socket.io-client';

// @ts-ignore
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002';

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<Function>> = new Map();

    connect(token: string) {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io(`${SOCKET_URL}/chat`, {
            auth: {
                token,
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.setupDefaultListeners();

        return this.socket;
    }

    private setupDefaultListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('✅ Socket connected:', this.socket?.id);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.listeners.clear();
        }
    }

    on(event: string, callback: Function) {
        if (!this.socket) {
            console.warn('Socket not connected');
            return;
        }

        // Store callback reference for cleanup
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        this.socket.on(event, callback as any);
    }

    off(event: string, callback?: Function) {
        if (!this.socket) return;

        if (callback) {
            this.socket.off(event, callback as any);
            this.listeners.get(event)?.delete(callback);
        } else {
            this.socket.off(event);
            this.listeners.delete(event);
        }
    }

    emit(event: string, data: any, callback?: Function) {
        if (!this.socket?.connected) {
            console.warn('Socket not connected, cannot emit event:', event);
            return;
        }

        if (callback) {
            this.socket.emit(event, data, callback);
        } else {
            this.socket.emit(event, data);
        }
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    getSocket(): Socket | null {
        return this.socket;
    }
}

export const socketService = new SocketService();