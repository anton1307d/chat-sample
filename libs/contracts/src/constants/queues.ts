/**
 * RabbitMQ Queue names
 *
 * Defines all queue names used in the microservices architecture.
 * Each queue handles specific types of messages.
 *
 * @example
 * import { QUEUES } from '@app/contracts';
 *
 * channel.assertQueue(QUEUES.MESSAGE_DELIVERY);
 */
export const QUEUES = {
    MESSAGE_DELIVERY: 'message-delivery-queue',
    STATUS_UPDATE: 'status-update-queue',
    PRESENCE_EVENTS: 'presence-events-queue',
    USER_EVENTS: 'user-events-queue',
    OFFLINE_MESSAGES: 'offline-messages-queue',
    DEAD_LETTER: 'dead-letter-queue',
} as const;

/**
 * RabbitMQ Exchange names
 *
 * Defines exchanges for message routing.
 * Each exchange handles a specific domain of events.
 *
 * @example
 * import { EXCHANGES } from '@app/contracts';
 *
 * channel.assertExchange(EXCHANGES.CHAT, 'topic', { durable: true });
 */
export const EXCHANGES = {
    CHAT: 'chat.exchange',
    PRESENCE: 'presence.exchange',
    STATUS: 'status.exchange',
    USER: 'user.exchange',
} as const;

/**
 * RabbitMQ Routing keys
 *
 * Defines routing keys for message routing within exchanges.
 * Used with topic exchanges for flexible routing.
 *
 * @example
 * import { ROUTING_KEYS, EXCHANGES } from '@app/contracts';
 *
 * channel.publish(
 *   EXCHANGES.CHAT,
 *   ROUTING_KEYS.MESSAGE_SEND,
 *   Buffer.from(JSON.stringify(message))
 * );
 */
export const ROUTING_KEYS = {
    MESSAGE_SEND: 'message.send',
    MESSAGE_DELIVERED: 'message.delivered',
    MESSAGE_READ: 'message.read',
    PRESENCE_ONLINE: 'presence.online',
    PRESENCE_OFFLINE: 'presence.offline',
    STATUS_UPDATE: 'status.update',
    USER_REGISTERED: 'user.registered',
} as const;