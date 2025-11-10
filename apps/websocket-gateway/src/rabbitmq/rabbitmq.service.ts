import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RabbitMQServiceBase } from '@app/common';

@Injectable()
export class RabbitMQService extends RabbitMQServiceBase {
    protected readonly logger = new Logger(RabbitMQService.name);

    constructor(configService: ConfigService) {
        super(configService);
    }
}