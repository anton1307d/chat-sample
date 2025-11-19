import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {AppModule} from "./app.module";
import {HttpExceptionFilter, LoggerService} from "@app/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());

    // CORS
    app.enableCors({
        origin: configService.getOrThrow<string>('CORS_ORIGIN', '').split(',') || '*',
        credentials: true,
    });

  app.useLogger(logger);

  app.enableShutdownHooks();

  const port = configService.get<number>('HTTP_PORT') || 3004;
  await app.listen(port);

  logger.log(`🚀 Users service is running on port ${port}`, 'Bootstrap');
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV')}`, 'Bootstrap');
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
