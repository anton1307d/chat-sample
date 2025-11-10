import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreateConversationDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEnum(['direct', 'group'])
    type?: 'direct' | 'group';

    @IsArray()
    @IsString({ each: true })
    participantIds: string[];
}