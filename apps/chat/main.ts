import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@app/common';

async function bootstrap() {
    const logger = new Logger('ChatService');
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    app.useGlobalFilters(new AllExceptionsFilter());

    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        credentials: true,
    });

    app.enableShutdownHooks();

    const port = process.env.HTTP_PORT || 3003;
    await app.listen(port);

    logger.log(`💬 Chat Service running on: http://localhost:${port}`);
}

bootstrap();