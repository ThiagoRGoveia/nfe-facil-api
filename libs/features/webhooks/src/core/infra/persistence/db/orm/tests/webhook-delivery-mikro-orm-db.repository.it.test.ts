import { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { WebhookDeliveryMikroOrmDbRepository } from '../webhook-delivery-mikro-orm-db.repository';
import { BaseIntegrationTestModule } from '@dev-modules/dev-modules/tests/base-integration-test.module';

import { WebhookDelivery, WebhookDeliveryStatus } from '@lib/webhooks/core/domain/entities/webhook-delivery.entity';
import { useDbWebhook } from '@lib/webhooks/core/infra/tests/factories/webhooks.factory';
import { Webhook } from '@lib/webhooks/core/domain/entities/webhook.entity';
import { useDbWebhookDelivery } from '@lib/webhooks/core/infra/tests/factories/webhook-deliveries.factory';
import { useUserFactory } from '@lib/users/core/infra/tests/factories/users.factory';
describe('WebhookDeliveryMikroOrmDbRepository (integration)', () => {
  let app: INestApplication;
  let orm: MikroORM;
  let em: EntityManager;
  let repository: WebhookDeliveryMikroOrmDbRepository;
  let testWebhook: Webhook;
  let testDelivery: WebhookDelivery;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BaseIntegrationTestModule],
      providers: [WebhookDeliveryMikroOrmDbRepository],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    em = orm.em as EntityManager;
    repository = module.get<WebhookDeliveryMikroOrmDbRepository>(WebhookDeliveryMikroOrmDbRepository);
    app = module.createNestApplication();

    await app.init();

    testWebhook = await useDbWebhook({ user: useUserFactory({}, em) }, em);
    testDelivery = await useDbWebhookDelivery(
      {
        webhook: testWebhook,
        status: WebhookDeliveryStatus.PENDING,
        nextAttempt: new Date('2023-01-01'),
        retryCount: 1,
      },
      em,
    );
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findPendingDeliveries', () => {
    it('should find pending deliveries ready for retry', async () => {
      // Create deliveries that shouldn't be included
      await useDbWebhookDelivery(
        {
          status: WebhookDeliveryStatus.SUCCESS,
          nextAttempt: new Date('2023-01-01'),
          webhook: testWebhook,
        },
        em,
      );
      await useDbWebhookDelivery(
        {
          status: WebhookDeliveryStatus.PENDING,
          nextAttempt: new Date('2030-01-01'), // Future date
          webhook: testWebhook,
        },
        em,
      );

      const results = await repository.findPendingDeliveries();

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(testDelivery.id);
      expect(results[0].status).toBe(WebhookDeliveryStatus.PENDING);
    });
  });

  describe('create', () => {
    it('should create a new delivery', async () => {
      const deliveryData = {
        webhook: testWebhook,
        payload: { event: 'test' },
        status: WebhookDeliveryStatus.PENDING,
        nextAttempt: new Date(),
        retryCount: 0,
      };

      const delivery = repository.create(deliveryData);
      await em.persistAndFlush(delivery);

      const found = await em.findOne(WebhookDelivery, delivery.id);
      expect(found).toBeDefined();
      expect(found?.status).toBe(WebhookDeliveryStatus.PENDING);
    });
  });

  describe('update', () => {
    it('should update an existing delivery', async () => {
      const updateData = {
        status: WebhookDeliveryStatus.RETRY_PENDING,
        nextAttempt: new Date('2023-01-02'),
        retryCount: 2,
      };

      const updatedDelivery = repository.update(testDelivery.id, updateData);
      await em.persistAndFlush(updatedDelivery);

      const found = await em.findOne(WebhookDelivery, testDelivery.id);
      expect(found?.status).toBe(WebhookDeliveryStatus.RETRY_PENDING);
      expect(found?.retryCount).toBe(2);
      expect(found?.nextAttempt).toEqual(new Date('2023-01-02'));
    });
  });
});
