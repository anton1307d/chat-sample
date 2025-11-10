import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Participant } from './participant.entity';

@Entity('conversations')
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    name: string;

    @Column({ default: 'direct' })
    type: string; // 'direct' | 'group'

    @Column({ name: 'created_by' })
    createdBy: string;

    @OneToMany(() => Participant, (participant: Participant) => participant.conversation)
    participants: Participant[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}