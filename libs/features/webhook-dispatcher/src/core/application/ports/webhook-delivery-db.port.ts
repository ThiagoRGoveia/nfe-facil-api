import { Injectable } from '@nestjs/common';
import { RequiredEntityData } from '@mikro-orm/core';
import { BaseDbPort } from '@lib/commons/core/ports/_base-db-port';
import { WebhookDelivery } from '@lib/webhooks/core/domain/entities/webhook-delivery.entity';

@Injectable()
export abstract class WebhookDeliveryDbPort extends BaseDbPort<WebhookDelivery> {
  abstract update(id: WebhookDelivery['id'], data: Partial<RequiredEntityData<WebhookDelivery>>): WebhookDelivery;
  abstract create(data: RequiredEntityData<WebhookDelivery>): WebhookDelivery;
  abstract findPendingDeliveries(): Promise<WebhookDelivery[]>;
}
