import { WebhookDelivery } from '@/core/webhooks/domain/entities/webhook-delivery.entity';
import { WebhookDeliveryStatus } from '@/core/webhooks/domain/entities/webhook-delivery.entity';
import { faker } from '@faker-js/faker';
import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';

export class WebhookDeliveryFactory extends Factory<WebhookDelivery> {
  model = WebhookDelivery;

  definition(): Partial<WebhookDelivery> {
    return {
      id: faker.string.uuid(),
      payload: {},
      status: WebhookDeliveryStatus.PENDING,
      retryCount: 0,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };
  }
}

export function useWebhookDeliveryFactory(
  data: Partial<RequiredEntityData<WebhookDelivery>>,
  em: EntityManager,
): WebhookDelivery {
  return new WebhookDeliveryFactory(em).makeOne(data);
}

export async function useDbWebhookDelivery(
  data: Partial<RequiredEntityData<WebhookDelivery>>,
  em: EntityManager,
): Promise<WebhookDelivery> {
  const delivery = useWebhookDeliveryFactory(data, em);
  await em.persistAndFlush(delivery);
  return delivery;
}
