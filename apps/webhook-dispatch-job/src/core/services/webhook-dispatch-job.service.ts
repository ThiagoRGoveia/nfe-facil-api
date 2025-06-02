import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateRequestContext, MikroORM } from '@mikro-orm/core';
import { WebhookDeliveryDbPort } from '@lib/webhooks/core/webhooks.module';
import { WebhookDispatcherService } from 'apps/webhook-dispatch-job/src/core/services/webhook-dispatcher.service';
import { WebhookDeliveryStatus } from '@lib/webhooks/core/domain/entities/webhook-delivery.entity';

interface WebhookDispatchMessage {
  deliveryId: string;
}

@Injectable()
export class WebhookDispatchJobService {
  private readonly logger = new Logger(WebhookDispatchJobService.name);

  constructor(
    private readonly webhookDeliveryDbPort: WebhookDeliveryDbPort,
    private readonly webhookDispatcherService: WebhookDispatcherService,
    private readonly orm: MikroORM,
  ) {}

  async processMessage(message: WebhookDispatchMessage): Promise<void> {
    this.logger.log(`Processing webhook delivery ${message.deliveryId}`);
    try {
      await this.processInDbContext(message.deliveryId);
      this.logger.log(`Successfully processed webhook delivery ${message.deliveryId}`);
    } catch (error) {
      this.logger.error(`Error processing webhook delivery ${message.deliveryId}:`, error);
      throw error;
    }
  }

  @CreateRequestContext()
  async processInDbContext(deliveryId: string): Promise<void> {
    const delivery = await this.webhookDeliveryDbPort.findById(deliveryId);

    if (!delivery) {
      throw new NotFoundException(`Webhook delivery with ID ${deliveryId} not found`);
    }

    try {
      await this.webhookDispatcherService.dispatch(delivery);

      // Update delivery status to success
      this.webhookDeliveryDbPort.update(delivery.id, {
        status: WebhookDeliveryStatus.SUCCESS,
        lastAttempt: new Date(),
      });
    } catch (error) {
      // Update delivery status to failed with error information
      delivery.setNextAttempt();
      this.webhookDeliveryDbPort.update(delivery.id, {
        status: WebhookDeliveryStatus.FAILED,
        retryCount: delivery.retryCount + 1,
        lastError: error.message,
        lastAttempt: new Date(),
      });

      // Rethrow the error to allow the queue to handle retry logic
      throw error;
    }

    await this.webhookDeliveryDbPort.save();
  }
}
