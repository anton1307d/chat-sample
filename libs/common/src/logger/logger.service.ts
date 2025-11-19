import { Injectable, LoggerService as NestLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLogger {
  private readonly logger: winston.Logger;

  constructor(private readonly configService: ConfigService) {
    const { combine, timestamp, printf, colorize, json } = winston.format;

    // Determine if the application is running in development mode
    const isDevelopment =
      this.configService.get('NODE_ENV') === 'development' ||
      !this.configService.get('NODE_ENV');

    // Choose a format based on the environment
    const logFormat = isDevelopment
      ? combine(
          colorize(),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          printf(({ level, message, timestamp, context, meta, trace }) => {
            const contextStr = context ? `[${context}]` : '';
            const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
            const traceStr = trace ? `\n${trace}` : '';
            return `${timestamp} ${level} ${contextStr} ${message}${metaStr}${traceStr}`;
          }),
        )
      : combine(timestamp(), json());

    this.logger = winston.createLogger({
      level: this.configService.get('LOG_LEVEL') || 'info',
      format: logFormat,
      transports: [
        new winston.transports.Console(),
        // Add file transport for production
        ...(isDevelopment
          ? []
          : [
              new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
              }),
              new winston.transports.File({
                filename: 'logs/combined.log',
              }),
            ]),
      ],
    });
  }

  log(message: any, context?: string, meta?: any) {
    this.logger.info(message, {
      context,
      meta,
    });
  }

  error(message: any, trace?: string, context?: string, meta?: any) {
    this.logger.error(message, {
      context,
      trace,
      meta,
    });
  }

  warn(message: any, context?: string, meta?: any) {
    this.logger.warn(message, {
      context,
      meta,
    });
  }

  debug(message: any, context?: string, meta?: any) {
    this.logger.debug(message, {
      context,
      meta,
    });
  }

  verbose(message: any, context?: string, meta?: any) {
    this.logger.verbose(message, {
      context,
      meta,
    });
  }
}