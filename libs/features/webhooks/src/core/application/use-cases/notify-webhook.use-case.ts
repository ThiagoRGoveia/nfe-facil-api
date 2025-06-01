import { BadRequestException, Injectable } from '@nestjs/common';
import { WebhookDbPort } from '../ports/webhook-db.port';
import { WebhookDeliveryDbPort } from '../ports/webhook-delivery-db.port';
import { WebhookDispatcherPort } from '../ports/webhook-dispatcher.port';
import { WebhookEvent } from '../../domain/entities/webhook.entity';
import { WebhookDeliveryStatus } from '../../domain/entities/webhook-delivery.entity';
import { PinoLogger } from 'nestjs-pino';
import { User } from '@/core/users/domain/entities/user.entity';
import { DatePort } from 'libs/tooling/date/src/core/date.adapter';

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
