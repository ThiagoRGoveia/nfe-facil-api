import { Injectable } from '@nestjs/common';
import { WebhookDelivery } from '../../domain/entities/webhook-delivery.entity';
import { RequiredEntityData } from '@mikro-orm/core';
import { BaseDbPort } from '@lib/commons/core/ports/_base-db-port';

@Injectable()
export abstract class WebhookDeliveryDbPort extends BaseDbPort<WebhookDelivery> {
  abstract update(id: WebhookDelivery['id'], data: Partial<RequiredEntityData<WebhookDelivery>>): WebhookDelivery;
  abstract create(data: RequiredEntityData<WebhookDelivery>): WebhookDelivery;
  abstract findPendingDeliveries(): Promise<WebhookDelivery[]>;
}
