import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { PresenceService } from './presence.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '@app/common';

@Controller('presence')
@UseGuards(JwtAuthGuard)
export class PresenceController {
    constructor(private readonly presenceService: PresenceService) {}

    @Get(':userId')
    async getUserPresence(@Param('userId') userId: string) {
        return this.presenceService.getUserPresence(userId);
    }

    @Get()
    async getBulkPresence(@Query('userIds') userIds: string) {
        const userIdArray = userIds.split(',');
        return this.presenceService.getBulkPresence(userIdArray);
    }

    @Post('heartbeat')
    @HttpCode(HttpStatus.OK)
    async heartbeat(@CurrentUser('userId') userId: string) {
        await this.presenceService.updateHeartbeat(userId);
        return { message: 'Heartbeat received' };
    }
}