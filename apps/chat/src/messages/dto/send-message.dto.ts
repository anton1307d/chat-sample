import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class SendMessageDto {
    @IsString()
    conversationId: string;

    @IsString()
    content: string;

    @IsOptional()
    @IsEnum(['text', 'image', 'video', 'file'])
    type?: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}