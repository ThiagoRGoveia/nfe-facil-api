import { NestFactory } from '@nestjs/core';
import { Logger as PinoLogger } from 'nestjs-pino';
import { Logger } from '@nestjs/common';
import { SQSEvent } from 'aws-lambda';
import { AppModule } from './app.module';
import { ReplaySubject, firstValueFrom } from 'rxjs';
import { OutputConsolidationJobService } from './core/output-consolidation-job.service';

const logger = new Logger('Lambda');

async function bootstrap(): Promise<OutputConsolidationJobService> {
  logger.log('COLD START: Initializing NestJS Application');
  const app = await NestFactory.createApplicationContext(AppModule);
  app.useLogger(app.get(PinoLogger));
  const service = app.get(OutputConsolidationJobService);
  return service;
}

// Start bootstrapping immediately, don't wait for handler to be called
const serviceSubject = new ReplaySubject<OutputConsolidationJobService>();
bootstrap()
  .then((service) => serviceSubject.next(service))
  .catch((error) => {
    logger.error('Error bootstrapping NestJS Application:', error);
    throw error;
  });

export const handler = async (event: SQSEvent) => {
  try {
    // Get the already bootstrapping service
    const service = await firstValueFrom(serviceSubject);
    logger.log(`Processing ${event.Records.length} messages`);
    await Promise.all(
      event.Records.map((record) => {
        const message = JSON.parse(record.body);
        return service.processMessage(message);
      }),
    );
  } catch (error) {
    logger.error('Error processing messages:', error);
    throw error;
  }
};

// For local development testing
if (process.env.NODE_ENV !== 'production') {
  bootstrap()
    .then((service) => {
      service
        .processMessage({
          batchId: process.env.TEST_BATCH_ID || 'test-batch-id',
        })
        .then(() => {
          logger.log('Process message completed');
        })
        .catch((error) => {
          logger.error('Error processing message:', error);
        });
    })
    .catch((error) => {
      logger.error('Error bootstrapping NestJS Application:', error);
      throw error;
    });
}
