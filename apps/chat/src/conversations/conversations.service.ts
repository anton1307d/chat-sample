import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Participant } from './entities/participant.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AddParticipantDto } from './dto/add-participant.dto';

@Injectable()
export class ConversationsService {
    constructor(
        @InjectRepository(Conversation)
        private conversationRepo: Repository<Conversation>,
        @InjectRepository(Participant)
        private participantRepo: Repository<Participant>,
    ) {}

    async create(creatorId: string, dto: CreateConversationDto) {
        const conversation = this.conversationRepo.create({
            name: dto.name,
            type: dto.type || 'direct',
            createdBy: creatorId,
        });

        const saved = await this.conversationRepo.save(conversation);

        // Add creator as participant
        await this.addParticipant(saved.id, { userId: creatorId });

        // Add other participants
        for (const userId of dto.participantIds || []) {
            await this.addParticipant(saved.id, { userId });
        }

        return this.findOne(saved.id);
    }

    async findOne(id: string) {
        const conversation = await this.conversationRepo.findOne({
            where: { id },
            relations: ['participants'],
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return conversation;
    }

    async findUserConversations(userId: string) {
        const participants = await this.participantRepo.find({
            where: { userId },
            relations: ['conversation', 'conversation.participants'],
        });

        return participants.map((p) => p.conversation);
    }

    async getParticipants(conversationId: string) {
        return await this.participantRepo.find({
            where: { conversationId },
            relations: ['user'],
        });
    }

    async addParticipant(conversationId: string, dto: AddParticipantDto) {
        const conversation = await this.findOne(conversationId);

        const participant = this.participantRepo.create({
            conversationId,
            userId: dto.userId,
        });

        return this.participantRepo.save(participant);
    }

    async removeParticipant(conversationId: string, userId: string) {
        await this.participantRepo.delete({ conversationId, userId });
        return { success: true };
    }

    async isParticipant(conversationId: string, userId: string): Promise<boolean> {
        const count = await this.participantRepo.count({
            where: { conversationId, userId },
        });
        return count > 0;
    }
}