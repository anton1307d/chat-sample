import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
    Matches,
    IsOptional,
} from 'class-validator';

export class RegisterDto {
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Username can only contain letters, numbers and underscores',
    })
    username: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(100)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: 'Password must contain uppercase, lowercase and number',
    })
    password: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    displayName?: string;
}