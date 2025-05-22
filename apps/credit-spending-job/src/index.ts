import { NestFactory } from '@nestjs/core';
import { Logger as PinoLogger } from 'nestjs-pino';
import { Logger } from '@nestjs/common';
import { SQSEvent } from 'aws-lambda';
import { AppModule } from './app.module';
import { ReplaySubject, firstValueFrom } from 'rxjs';
import { CreditSpendingJobService } from './core/credit-spending-job.service';

const logger = new Logger('Lambda');

// Create a ReplaySubject to store the service instance
async function bootstrap(): Promise<CreditSpendingJobService> {
  logger.log('COLD START: Initializing Credit Spending NestJS Application');
  const app = await NestFactory.createApplicationContext(AppModule);
  app.useLogger(app.get(PinoLogger));
  const service = app.get(CreditSpendingJobService);
  return service;
}

// Start bootstrapping immediately, don't wait for handler to be called
const serviceSubject = new ReplaySubject<CreditSpendingJobService>();
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

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'uat') {
  bootstrap()
    .then((service) => {
      service
        .processMessage({
          userId: '19198a71-88e6-466b-aed0-5f577cce77f2',
          operationId: 'a35bcc3b-46f0-4665-8708-022063a733f7',
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
