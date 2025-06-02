import { BadRequestException, Injectable } from '@nestjs/common';
import { WebhookDeliveryDbPort } from '../ports/webhook-delivery-db.port';
import { WebhookDispatcherPort } from '../ports/webhook-dispatcher.port';
import { PinoLogger } from 'nestjs-pino';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { DatePort } from '@lib/date/core/date.adapter';
import { WebhookDbPort } from '@lib/webhooks/core/application/ports/webhook-db.port';
import { WebhookDeliveryStatus } from '@lib/webhooks/core/domain/entities/webhook-delivery.entity';
import { WebhookEvent } from '@lib/documents/core/application/dtos/webhook-events.dto';

export interface NotifyWebhookParams {
  user: User;
  event: WebhookEvent;
  payload: object;
}

@Injectable()
export class NotifyWebhookUseCase {
  constructor(
    private readonly webhookRepository: WebhookDbPort,
    private readonly deliveryRepository: WebhookDeliveryDbPort,
    private readonly dispatcher: WebhookDispatcherPort,
    private readonly logger: PinoLogger,
    private readonly datePort: DatePort,
  ) {}

  async execute(params: NotifyWebhookParams): Promise<void> {
    const webhooks = await this.webhookRepository.findActiveByEventAndUser(params.event, params.user);

    await Promise.all(
      webhooks.map(async (webhook) => {
        // Create delivery data according to RequiredEntityData type
        const delivery = this.deliveryRepository.create({
          webhook: webhook,
          payload: {
            event: params.event,
            timestamp: this.datePort.now().toISOString(),
            payload: params.payload,
          },
          status: WebhookDeliveryStatus.PENDING,
          retryCount: 0,
          lastError: null,
          lastAttempt: null,
        });

        try {
          await this.dispatcher.dispatch(delivery);
          this.deliveryRepository.update(delivery.id, {
            status: WebhookDeliveryStatus.SUCCESS,
          });
        } catch (error) {
          delivery.setNextAttempt();
          this.deliveryRepository.update(delivery.id, {
            status: WebhookDeliveryStatus.FAILED,
            retryCount: delivery.retryCount + 1,
            lastError: error.message,
            lastAttempt: this.datePort.now(),
          });
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
