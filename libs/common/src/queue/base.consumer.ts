import {
  OnQueueFailed,
  OnQueueCompleted,
  OnQueueActive,
  OnQueueError,
} from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

export abstract class BaseConsumer {
  protected readonly logger: Logger;

  protected constructor(loggerContext: string) {
    this.logger = new Logger(loggerContext);
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}...`, {
      jobId: job.id,
      jobName: job.name,
      attempts: job.attemptsMade,
    });
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Completed job ${job.id} of type ${job.name}`, {
      jobId: job.id,
      jobName: job.name,
      result,
      duration: Date.now() - job.processedOn,
    });
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Failed job ${job.id} of type ${job.name}: ${error.message}`,
      {
        jobId: job.id,
        jobName: job.name,
        error: error.message,
        stack: error.stack,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        data: job.data,
      },
    );
  }

  @OnQueueError()
  onError(error: Error) {
    this.logger.error(`Queue error: ${error.message}`, {
      error: error.message,
      stack: error.stack,
    });
  }
}
