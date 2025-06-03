import { Module } from '@nestjs/common';
import { QueuePort } from './core/ports/queue.port';
import { SQSClient } from './core/clients/sqs.client';

@Module({
  providers: [
    {
      provide: QueuePort,
      useClass: SQSClient,
    },
  ],
  exports: [QueuePort],
})
export class QueueLibModule {}
