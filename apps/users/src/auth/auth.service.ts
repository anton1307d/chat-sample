import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { HashUtil, InjectRedis } from '@app/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @InjectRedis() private readonly redis: Redis,
    ) {}

    async register(registerDto: RegisterDto) {
        const { username, email, password, displayName } = registerDto;

        // Check if user exists
        const existingUser = await this.userRepository.findOne({
            where: [{ username }, { email }],
        });

        if (existingUser) {
            throw new ConflictException('Username or email already exists');
        }

        // Hash password
        const passwordHash = await HashUtil.hash(password);

        // Create user
        const user = this.userRepository.create({
            username,
            email,
            passwordHash,
            displayName: displayName || username,
        });

        const savedUser = await this.userRepository.save(user);

        // Generate tokens
        const tokens = await this.generateTokens(savedUser);

        this.logger.log(`User registered: ${savedUser.username}`);

        return {
            user: savedUser.toJSON(),
            ...tokens,
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        // Find user
        const user = await this.userRepository.findOne({ where: { email } });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isValidPassword = await HashUtil.compare(password, user.passwordHash);

        if (!isValidPassword) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate tokens
        const tokens = await this.generateTokens(user);

        this.logger.log(`User logged in: ${user.username}`);

        return {
            user: user.toJSON(),
            ...tokens,
        };
    }

    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken);

            // Check if refresh token is valid in Redis
            const storedToken = await this.redis.get(`refresh:${payload.userId}`);

            if (!storedToken || storedToken !== refreshToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Find user
            const user = await this.userRepository.findOne({
                where: { id: payload.userId },
            });

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            // Generate new tokens
            const tokens = await this.generateTokens(user);

            return tokens;
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async logout(userId: string) {
        // Remove the refresh token from Redis
        await this.redis.del(`refresh:${userId}`);

        this.logger.log(`User logged out: ${userId}`);
    }

    private async generateTokens(user: User) {
        const payload = {
            userId: user.id,
            username: user.username,
            email: user.email,
        };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
        });

        const refreshToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
        });

        // Store refresh token in Redis
        const refreshExpiry = 7 * 24 * 60 * 60; // 7 days in seconds
        await this.redis.setex(`refresh:${user.id}`, refreshExpiry, refreshToken);

        return {
            accessToken,
            refreshToken,
        };
    }

    async validateUser(userId: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return user;
    }
}