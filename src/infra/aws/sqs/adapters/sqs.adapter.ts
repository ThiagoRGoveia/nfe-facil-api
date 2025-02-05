import { SQSClient } from '../clients/sqs.client';
import { QueuePort } from '../ports/queue.port';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SQSAdapter implements QueuePort {
  constructor(private readonly sqsClient: SQSClient) {}

  async sendMessage<T>(queue: string, message: T): Promise<void> {
    try {
      const messageBody = JSON.stringify(message);
      await this.sqsClient.sendMessage(queue, messageBody);
    } catch (error) {
      throw new Error(`Failed to send message to SQS: ${error.message}`);
    }
  }
}
