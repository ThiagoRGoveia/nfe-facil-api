import { NestFactory } from '@nestjs/core';
import { Logger as PinoLogger } from 'nestjs-pino';
import { Logger } from '@nestjs/common';
import { SQSEvent } from 'aws-lambda';
import { AppModule } from './app.module';
import { ReplaySubject, firstValueFrom } from 'rxjs';
import { ProcessDocumentJobService } from './core/process-document-job.service';

const logger = new Logger('Lambda');

// Create a ReplaySubject to store the service instance

async function bootstrap(): Promise<ProcessDocumentJobService> {
  logger.log('COLD START: Initializing NestJS Application');
  const app = await NestFactory.createApplicationContext(AppModule);
  app.useLogger(app.get(PinoLogger));
  const service = app.get(ProcessDocumentJobService);
  return service;
}

// // Start bootstrapping immediately, don't wait for handler to be called
const serviceSubject = new ReplaySubject<ProcessDocumentJobService>();
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
