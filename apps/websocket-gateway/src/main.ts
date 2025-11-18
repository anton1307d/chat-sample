import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './adapters/redis-io.adapter';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);

    const redisIoAdapter = new RedisIoAdapter(app, configService);
    await redisIoAdapter.connectToRedis();

    app.useWebSocketAdapter(redisIoAdapter);

    app.enableCors({
        origin: configService.get<string>('CORS_ORIGIN')?.split(',') || ['http://localhost:5173'],
        credentials: true,
    });

    //

    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
    signals.forEach((signal) => {
        process.on(signal, async () => {
            logger.log(`Received ${signal}, starting graceful shutdown...`);
            await redisIoAdapter.close();
            await app.close();
            logger.log('Application closed');
            process.exit(0);
        });
    });

    const port = configService.get<number>('PORT') || 3002;
    await app.listen(port);


    logger.log(`WebSocket Gateway running on port ${port}`);
}

bootstrap();
