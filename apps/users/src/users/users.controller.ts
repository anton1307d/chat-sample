import {
    Controller,
    Get,
    Put,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@app/common';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('me')
    async getProfile(@CurrentUser('userId') userId: string) {
        const user = await this.usersService.findById(userId);
        return user.toJSON();
    }

    @Put('me')
    async updateProfile(
        @CurrentUser('userId') userId: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        const user = await this.usersService.updateUser(userId, updateUserDto);
        return user.toJSON();
    }

    @Get(':id')
    async getUserById(@Param('id') id: string) {
        const user = await this.usersService.findById(id);
        return user.toJSON();
    }
}