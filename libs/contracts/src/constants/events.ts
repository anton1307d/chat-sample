/**
 * Event type constants
 *
 * Use these constants instead of magic strings to prevent typos
 * and enable type checking across the application.
 *
 * @example
 * import { EVENTS } from '@app/contracts';
 *
 * // Good:
 * eventEmitter.emit(EVENTS.USER_REGISTERED, payload);
 *
 * // Bad:
 * eventEmitter.emit('user.registered', payload);
 */
export const EVENTS = {
    // User events
    USER_REGISTERED: 'user.registered',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',

    // Presence events
    PRESENCE_ONLINE: 'presence.online',
    PRESENCE_OFFLINE: 'presence.offline',
    PRESENCE_HEARTBEAT: 'presence.heartbeat',

    // Message events
    MESSAGE_SENT: 'message.sent',
    MESSAGE_DELIVERED: 'message.delivered',
    MESSAGE_READ: 'message.read',
    TYPING_START: 'typing.start',
    TYPING_STOP: 'typing.stop',

    // Status events
    STATUS_UPDATE: 'status.update',

    // Message events
    MESSAGE_CREATE_REQUEST: 'message.create-request',
    MESSAGE_CREATE_ERROR: 'message.create-error',
    MESSAGE_CONFIRMED: 'message.confirmed'
} as const;

/**
 * Extract all event type values as a union type
 *
 * @example
 * function handleEvent(eventType: EventType) {
 *   // eventType can only be one of the EVENTS values
 * }
 */
export type EventType = (typeof EVENTS)[keyof typeof EVENTS];