import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async findById(id: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { username } });
    }

    async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findById(id);

        if (updateUserDto.displayName !== undefined) {
            user.displayName = updateUserDto.displayName;
        }

        if (updateUserDto.profilePictureUrl !== undefined) {
            user.profilePictureUrl = updateUserDto.profilePictureUrl;
        }

        if (updateUserDto.phoneNumber !== undefined) {
            user.phoneNumber = updateUserDto.phoneNumber;
        }

        return this.userRepository.save(user);
    }

    async updateLastSeen(id: string): Promise<void> {
        await this.userRepository.update(id, {
            lastSeen: new Date(),
        });
    }
}