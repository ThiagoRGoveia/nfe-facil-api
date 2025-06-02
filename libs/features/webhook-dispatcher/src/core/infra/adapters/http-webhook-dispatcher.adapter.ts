import { Injectable } from '@nestjs/common';
import { WebhookDispatcherPort } from '../../application/ports/webhook-dispatcher.port';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { QueuePort } from '@lib/queue/core/ports/queue.port';
import { WebhookDelivery } from '@lib/webhooks/core/domain/entities/webhook-delivery.entity';

@Injectable()
export class HttpWebhookDispatcherAdapter implements WebhookDispatcherPort {
  private readonly webhookDispatchQueue: string;

  constructor(
    private readonly queuePort: QueuePort,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    const queueName = this.configService.get<string>('WEBHOOK_DISPATCH_QUEUE');
    if (!queueName) {
      throw new Error('WEBHOOK_DISPATCH_QUEUE is not set');
    }
    this.webhookDispatchQueue = queueName;
  }

  async dispatch(delivery: WebhookDelivery): Promise<void> {
    try {
      // Queue the webhook delivery for asynchronous processing
      await this.queuePort.sendMessage(this.webhookDispatchQueue, { deliveryId: delivery.id }, { fifo: false });
      this.logger.info(`Webhook delivery ${delivery.id} queued for processing`);
    } catch (error) {
      this.logger.error(`Error queuing webhook delivery ${delivery.id}:`, error);
      throw new Error(`Failed to queue webhook delivery: ${error.message}`);
    }
  }
}
