import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter} from '@app/common';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
    const logger = new Logger('APIGateway');
    const app = await NestFactory.create(AppModule);

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
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.setGlobalPrefix('api/v1');

    app.enableShutdownHooks();

    const port = process.env.HTTP_PORT || 3000;
    await app.listen(port);

    logger.log(`🚀 API Gateway running on: http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/api/v1`);
    logger.log(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);
}

bootstrap();
