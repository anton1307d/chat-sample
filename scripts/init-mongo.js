db = db.getSiblingDB('chat_messages');

db.createCollection('messages');
db.createCollection('conversations');

db.messages.createIndex({ conversationId: 1, sentAt: -1 });
db.messages.createIndex({ senderId: 1 });
db.messages.createIndex({ 'readBy': 1 });
db.messages.createIndex({ sentAt: 1 });

db.conversations.createIndex({ participants: 1 });
db.conversations.createIndex({ updatedAt: -1 });
db.conversations.createIndex({ type: 1 });

db.createUser({
    user: 'chat_user',
    pwd: 'chat_password',
    roles: [
        {
            role: 'readWrite',
            db: 'chat_messages'
        }
    ]
});

print('MongoDB initialization completed');