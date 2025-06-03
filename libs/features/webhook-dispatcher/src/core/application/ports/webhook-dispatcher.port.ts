import { WebhookDelivery } from '@lib/webhooks/core/domain/entities/webhook-delivery.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class WebhookDispatcherPort {
  abstract dispatch(delivery: WebhookDelivery): Promise<void>;
}
