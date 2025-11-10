import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import {AppModule} from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);

    // Global pipes
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Global filters
    // app.useGlobalFilters(new AllExceptionsFilter());

    // CORS
    app.enableCors({
        origin: configService.getOrThrow<string>('CORS_ORIGIN', '').split(',') || '*',
        credentials: true,
    });

  app.useLogger(logger);

  app.enableShutdownHooks();

  const httpPort = configService.getOrThrow<number>('HTTP_PORT');
  await app.listen(httpPort);

  logger.log(`🚀 Users service is running on port ${httpPort}`, 'Bootstrap');
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV')}`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
