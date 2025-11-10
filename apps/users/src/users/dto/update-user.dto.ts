import { IsString, IsOptional, MaxLength, IsUrl } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    displayName?: string;

    @IsOptional()
    @IsUrl()
    profilePictureUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    phoneNumber?: string;
}