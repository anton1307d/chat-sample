import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter, LoggerService } from '@app/common';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const logger = app.get(LoggerService);
    app.useLogger(logger);

    app.use(helmet());
    app.use(compression());

    // Global pipes
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());

    app.enableCors({
        origin: configService.get<string>('CORS_ORIGIN')?.split(',') || '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.setGlobalPrefix('api/v1');

    app.enableShutdownHooks();

    const port = configService.get<number>('HTTP_PORT') || 3000;
    await app.listen(port);

    logger.log(`API Gateway running on: http://localhost:${port}`, 'Bootstrap');
    logger.log(`API Documentation: http://localhost:${port}/api/v1`, 'Bootstrap');
    logger.log(`Security: Helmet, CORS, Rate Limiting enabled`, 'Bootstrap');
}

bootstrap();
