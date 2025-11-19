import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { LoggerService } from '@app/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const logger = app.get(LoggerService);
    app.useLogger(logger);

    app.useWebSocketAdapter(new IoAdapter(app));

    app.enableCors({
        origin: configService.get<string>('CORS_ORIGIN')?.split(',') || '*',
        credentials: true,
    });

    app.enableShutdownHooks();

    const port = configService.get<number>('WS_PORT') || 3003;
    await app.listen(port);

    logger.log(`Chat service running on: http://localhost:${port}`, 'Bootstrap');
    logger.log(`WebSocket server ready`, 'Bootstrap');
}

bootstrap();
