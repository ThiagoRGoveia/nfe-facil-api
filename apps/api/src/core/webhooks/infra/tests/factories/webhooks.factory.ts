import { Webhook } from '@/core/webhooks/domain/entities/webhook.entity';
import { faker } from '@faker-js/faker';
import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';
import { WebhookAuthType, WebhookEvent, WebhookStatus } from '@/core/webhooks/domain/entities/webhook.entity';

export class WebhookFactory extends Factory<Webhook> {
  model = Webhook;

  definition(): Partial<Webhook> {
    return {
      id: faker.string.uuid(),
      name: faker.lorem.words(3),
      url: faker.internet.url(),
      status: WebhookStatus.ACTIVE,
      events: [faker.helpers.arrayElement(Object.values(WebhookEvent))],
      authType: WebhookAuthType.NONE,
      headers: {},
      maxRetries: 5,
      timeout: 5000,
      createdAt: faker.date.past(),
    };
  }
}

export function useWebhookFactory(data: Partial<RequiredEntityData<Webhook>>, em: EntityManager): Webhook {
  return new WebhookFactory(em).makeOne(data);
}

export async function useDbWebhook(data: Partial<RequiredEntityData<Webhook>>, em: EntityManager): Promise<Webhook> {
  const webhook = useWebhookFactory(data, em);
  await em.persistAndFlush(webhook);
  return webhook;
}
