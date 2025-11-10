import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
    @Prop({ required: true })
    conversationId: string;

    @Prop({ required: true })
    senderId: string;

    @Prop({ required: true })
    content: string;

    @Prop({ default: 'text' })
    type: string; // 'text' | 'image' | 'video' | 'file'

    @Prop({ type: Object })
    metadata: Record<string, any>;

    @Prop({ type: [String], default: [] })
    readBy: string[];

    @Prop()
    sentAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes
MessageSchema.index({ conversationId: 1, sentAt: -1 });
MessageSchema.index({ senderId: 1 });