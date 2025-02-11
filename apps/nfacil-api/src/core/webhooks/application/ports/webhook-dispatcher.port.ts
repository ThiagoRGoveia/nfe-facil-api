import { Injectable } from '@nestjs/common';
import { WebhookDelivery } from '../../domain/entities/webhook-delivery.entity';

@Injectable()
export abstract class WebhookDispatcherPort {
  abstract dispatch(delivery: WebhookDelivery): Promise<void>;
}
