import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SQSEvent } from 'aws-lambda';
import { AppModule } from './app.module';
import { ProcessDocumentJobService } from './core/process-document-job.service';

const logger = new Logger('Lambda');

let service: ProcessDocumentJobService;

async function bootstrap() {
  if (!service) {
    const app = await NestFactory.createApplicationContext(AppModule);
    service = app.get(ProcessDocumentJobService);
  }
  return service;
}

export const handler = async (event: SQSEvent) => {
  const service = await bootstrap();

  try {
    logger.log(`Processing ${event.Records.length} messages`);

    const results = await Promise.all(
      event.Records.map((record) => {
        const message = JSON.parse(record.body);
        return service.processMessage(message);
      }),
    );

    logger.log(`Successfully processed ${results.length} messages`);
    return {
      batchItemFailures: [],
    };
  } catch (error) {
    logger.error('Error processing messages:', error);
    throw error;
  }
};
