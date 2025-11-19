import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './adapters/redis-io.adapter';
import { LoggerService } from '@app/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const logger = app.get(LoggerService);
    app.useLogger(logger);

    const configService = app.get(ConfigService);

    const redisIoAdapter = new RedisIoAdapter(app, configService);
    await redisIoAdapter.connectToRedis();

    app.useWebSocketAdapter(redisIoAdapter);

    app.enableCors({
        origin: configService.get<string>('CORS_ORIGIN')?.split(',') || ['http://localhost:5173'],
        credentials: true,
    });

    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
    signals.forEach((signal) => {
        process.on(signal, async () => {
            logger.log(`Received ${signal}, starting graceful shutdown...`, 'Bootstrap');
            await redisIoAdapter.close();
            await app.close();
            logger.log('Application closed', 'Bootstrap');
            process.exit(0);
        });
    });

    const port = configService.get<number>('PORT') || 3002;
    await app.listen(port);

    logger.log(`WebSocket Gateway running on port ${port}`, 'Bootstrap');
}

bootstrap();
