import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const logger = app.get(Logger);

    app.useWebSocketAdapter(new IoAdapter(app));

    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        credentials: true,
    });

    app.enableShutdownHooks();

    const port = process.env.WS_PORT || 3002;
    await app.listen(port);

    logger.log(`🔌 WebSocket Gateway running on: http://localhost:${port}`);
    logger.log(`📡 WebSocket server ready`);
}

bootstrap();
