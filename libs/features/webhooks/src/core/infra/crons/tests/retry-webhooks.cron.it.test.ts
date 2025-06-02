import { INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { BaseIntegrationTestModule } from '@dev-modules/dev-modules/tests/base-integration-test.module';
import { RetryWebhooksCron } from '../retry-webhooks.cron';
import { WebhooksModule } from '@lib/webhooks/core/webhooks.module';
import { createMock } from '@golevelup/ts-jest';
import { WebhookDeliveryStatus } from '@lib/webhooks/core/domain/entities/webhook-delivery.entity';
import { useDbWebhook } from '@lib/webhooks/core/infra/tests/factories/webhooks.factory';
import { useDbUser } from '@lib/users/core/infra/tests/factories/users.factory';
import { HttpClientPort } from '@lib/webhooks/core/application/ports/http-client.port';
import { useDbWebhookDelivery } from '../../tests/factories/webhook-deliveries.factory';

jest.setTimeout(100000);
describe('RetryWebhooksCron (Integration)', () => {
  let app: INestApplication;
  let em: EntityManager;
  let cron: RetryWebhooksCron;
  let httpClient: jest.Mocked<HttpClientPort>;

  beforeEach(async () => {
    httpClient = createMock<HttpClientPort>({
      request: jest.fn().mockResolvedValue({ status: 200, data: {}, headers: {} }),
    });

    const module: TestingModule = await Test.createTestingModule({
      imports: [BaseIntegrationTestModule, WebhooksModule],
      providers: [RetryWebhooksCron],
    })
      .overrideProvider(HttpClientPort)
      .useValue(httpClient)
      .compile();

    em = module.get<EntityManager>(EntityManager);
    cron = module.get<RetryWebhooksCron>(RetryWebhooksCron);

    app = module.createNestApplication();

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('handleCron', () => {
    it('should process pending webhook deliveries', async () => {
      // Seed test data
      const user = await useDbUser({}, em);
      const webhook = await useDbWebhook({ url: 'https://example.com', user: user, maxRetries: 5 }, em);
      const delivery = await useDbWebhookDelivery(
        {
          status: WebhookDeliveryStatus.PENDING,
          nextAttempt: new Date(Date.now() - 5000),
          webhook: webhook,
          retryCount: 0,
        },
        em,
      );

      await cron.handleCron();

      // Verify HTTP client was called
      expect(httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: webhook.url,
          body: delivery.payload,
        }),
      );

      // Verify delivery status updated
      const updatedDelivery = await em.findOne(delivery.constructor, delivery.id);
      expect(updatedDelivery?.status).toBe(WebhookDeliveryStatus.SUCCESS);
      expect(updatedDelivery?.retryCount).toBe(1);
    });

    it('should handle failed deliveries', async () => {
      // Seed test data with failing request
      httpClient.request.mockRejectedValueOnce(new Error('Network error'));
      const user = await useDbUser({}, em);
      const webhook = await useDbWebhook({ url: 'https://example.com', user: user }, em);
      const delivery = await useDbWebhookDelivery(
        {
          status: WebhookDeliveryStatus.PENDING,
          retryCount: 0,
          webhook,
          nextAttempt: new Date(Date.now() - 5000),
        },
        em,
      );

      await cron.handleCron();

      // Verify delivery marked as failed after retries
      const updatedDelivery = await em.findOne(delivery.constructor, delivery.id);
      expect(updatedDelivery?.status).toBe(WebhookDeliveryStatus.RETRY_PENDING);
      expect(updatedDelivery?.retryCount).toBe(1);
    });

    it('should skip non-pending deliveries', async () => {
      // Seed completed delivery
      const user = await useDbUser({}, em);
      const webhook = await useDbWebhook({ url: 'https://example.com', user: user }, em);
      await useDbWebhookDelivery(
        {
          status: WebhookDeliveryStatus.SUCCESS,
          retryCount: 1,
          webhook,
        },
        em,
      );

      await cron.handleCron();

      expect(httpClient.request).not.toHaveBeenCalled();
    });
  });
});
