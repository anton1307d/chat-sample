import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('conversation_participants')
export class Participant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'conversation_id' })
    conversationId: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => Conversation, (conversation) => conversation.participants)
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @CreateDateColumn({ name: 'joined_at' })
    joinedAt: Date;
}