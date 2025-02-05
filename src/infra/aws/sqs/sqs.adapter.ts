import { QueuePort } from './ports/queue.port';
import { Injectable } from '@nestjs/common';
import { SQSService } from './services/sqs.service';

@Injectable()
export class SQSAdapter implements QueuePort {
  constructor(private readonly sqsService: SQSService) {}

  async sendMessage<T>(queue: string, message: T): Promise<void> {
    try {
      const messageBody = JSON.stringify(message);
      await this.sqsService.sendMessage(queue, messageBody);
    } catch (error) {
      throw new Error(`Failed to send message to SQS: ${error.message}`);
    }
  }
}
