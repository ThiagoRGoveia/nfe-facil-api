import { BadRequestException, Injectable } from '@nestjs/common';
import { WebhookDeliveryDbPort } from '../ports/webhook-delivery-db.port';
import { WebhookDispatcherPort } from '../ports/webhook-dispatcher.port';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RetryWebhookDeliveryUseCase {
  constructor(
    private readonly deliveryRepository: WebhookDeliveryDbPort,
    private readonly dispatcher: WebhookDispatcherPort,
    private readonly logger: PinoLogger,
  ) {}

  async execute(): Promise<void> {
    const failedDeliveries = await this.deliveryRepository.findPendingDeliveries();

    await Promise.all(
      failedDeliveries.map(async (delivery) => {
        const webhook = await delivery.webhook.load();
        if (!webhook) {
          delivery.markAsFailed('Webhook not found');
          return;
        }
        delivery.startRetry();
        try {
          await this.dispatcher.dispatch(delivery);
          delivery.markAsSuccess();
        } catch (error) {
          if (!delivery.canRetry(webhook.maxRetries)) {
            delivery.markAsFailed(error.message);
          } else {
            delivery.setNextAttempt();
            delivery.markAsRetryPending(error.message);
          }
        }
      }),
    );
    try {
      await this.deliveryRepository.save();
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Failed to save webhook delivery');
    }
  }
}
