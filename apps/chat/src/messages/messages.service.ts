import {Injectable, Logger} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { GetMessagesDto } from './dto/get-messages.dto';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { EVENTS } from '@app/contracts';

@Injectable()
export class MessagesService {

    private readonly logger = new Logger(MessagesService.name);

    constructor(
        @InjectModel(Message.name)
        private messageModel: Model<MessageDocument>,
        private rabbitMQService: RabbitMQService,
    ) {}

    /**
     * Create message (used internally by RabbitMQ consumer)
     * Similar to sendMessage but without RabbitMQ publishing
     */
    async createMessage(data: {
        conversationId: string;
        senderId: string;
        content: string;
        type?: string;
        metadata?: any;
        replyTo?: string;
        mentions?: string[];
        attachments?: string[];
    }): Promise<MessageDocument> {
        this.logger.log(
            `Creating message from ${data.senderId} in conversation ${data.conversationId}`,
        );

        try {
            const message = new this.messageModel({
                conversationId: data.conversationId,
                senderId: data.senderId,
                content: data.content,
                type: data.type || 'text',
                metadata: data.metadata || {},
                replyTo: data.replyTo,
                mentions: data.mentions || [],
                attachments: data.attachments || [],
                sentAt: new Date(),
                readBy: [data.senderId], // Sender has read their own message
                readReceipts: [{
                    userId: data.senderId,
                    readAt: new Date(),
                }],
            });

            // 3. Save to MongoDB
            const savedMessage = await message.save();
            this.logger.log(`Message saved to MongoDB: ${savedMessage._id}`);

            return savedMessage;

        } catch (error) {
            this.logger.error(`Failed to create message: ${error.message}`, error.stack);
            throw error;
        }
    }


    async getMessages(conversationId: string, query: GetMessagesDto) {
        const limit = query.limit || 50;
        const skip = query.skip || 0;

        const messages = await this.messageModel
            .find({ conversationId })
            .sort({ sentAt: -1 })
            .limit(limit)
            .skip(skip)
            .exec();

        const total = await this.messageModel.countDocuments({ conversationId });

        return {
            messages,
            total,
            hasMore: skip + messages.length < total,
        };
    }

    async findOne(messageId: string) {
        return this.messageModel.findById(messageId).exec();
    }

    async markAsRead(messageId: string, userId: string) {
        const message = await this.messageModel.findById(messageId);

        if (!message.readBy.includes(userId)) {
            message.readBy.push(userId);
            await message.save();

            // Publish read event
            await this.rabbitMQService.publish('chat.exchange', 'message.status.read',{
                eventType: EVENTS.MESSAGE_READ,
                messageId,
                recipientId: userId,
                readAt: new Date(),
            });
        }

        return message;
    }
}