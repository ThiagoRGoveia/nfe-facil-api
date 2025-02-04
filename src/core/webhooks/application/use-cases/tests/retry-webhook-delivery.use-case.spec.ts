import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { WebhookDeliveryDbPort } from '../../ports/webhook-delivery-db.port';
import { WebhookDispatcherPort } from '../../ports/webhook-dispatcher.port';
import { RetryWebhookDeliveryUseCase } from '../retry-webhook-delivery.use-case';
import { Webhook } from '@/core/webhooks/domain/entities/webhook.entity';
import { useWebhookFactory } from '@/core/webhooks/infra/tests/factories/webhooks.factory';
import { useWebhookDeliveryFactory } from '@/core/webhooks/infra/tests/factories/webhook-deliveries.factory';
import { WebhookDeliveryStatus } from '@/core/webhooks/domain/entities/webhook-delivery.entity';
import { BadRequestException } from '@nestjs/common';

describe('RetryWebhookDeliveryUseCase', () => {
  let useCase: RetryWebhookDeliveryUseCase;
  let deliveryRepo: jest.Mocked<WebhookDeliveryDbPort>;
  let dispatcher: jest.Mocked<WebhookDispatcherPort>;
  let em: EntityManager;
  let testWebhook: Webhook;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        RetryWebhookDeliveryUseCase,
        {
          provide: WebhookDeliveryDbPort,
          useValue: createMock<WebhookDeliveryDbPort>({
            findPendingDeliveries: jest.fn(),
            save: jest.fn().mockResolvedValue(undefined),
          }),
        },
        {
          provide: WebhookDispatcherPort,
          useValue: createMock<WebhookDispatcherPort>({
            dispatch: jest.fn(),
          }),
        },
      ],
    }).compile();

    useCase = module.get<RetryWebhookDeliveryUseCase>(RetryWebhookDeliveryUseCase);
    deliveryRepo = module.get(WebhookDeliveryDbPort);
    dispatcher = module.get(WebhookDispatcherPort);
    em = module.get(EntityManager);

    testWebhook = useWebhookFactory({}, em);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should successfully retry a delivery', async () => {
    const delivery = useWebhookDeliveryFactory(
      {
        webhook: testWebhook,
        status: WebhookDeliveryStatus.PENDING,
        retryCount: 1,
      },
      em,
    );
    deliveryRepo.findPendingDeliveries.mockResolvedValue([delivery]);
    dispatcher.dispatch.mockResolvedValue(undefined);

    await useCase.execute();

    expect(dispatcher.dispatch).toHaveBeenCalledWith(delivery);
    expect(delivery.status).toBe(WebhookDeliveryStatus.SUCCESS);
  });

  it('should handle missing webhook', async () => {
    const delivery = useWebhookDeliveryFactory(
      {
        status: WebhookDeliveryStatus.PENDING,
        webhook: testWebhook,
      },
      em,
    );
    deliveryRepo.findPendingDeliveries.mockResolvedValue([delivery]);
    jest.spyOn(delivery.webhook, 'load').mockResolvedValue(null);

    await useCase.execute();

    expect(delivery.status).toBe(WebhookDeliveryStatus.FAILED);
    expect(delivery.lastError).toBe('Webhook not found');
  });

  it('should mark as failed when max retries exceeded', async () => {
    const delivery = useWebhookDeliveryFactory(
      {
        webhook: testWebhook,
        status: WebhookDeliveryStatus.PENDING,
        retryCount: testWebhook.maxRetries + 1,
      },
      em,
    );
    deliveryRepo.findPendingDeliveries.mockResolvedValue([delivery]);
    dispatcher.dispatch.mockRejectedValue(new Error('Network error'));

    await useCase.execute();

    expect(delivery.status).toBe(WebhookDeliveryStatus.FAILED);
    expect(delivery.lastError).toBe('Network error');
  });

  it('should handle database errors', async () => {
    const delivery = useWebhookDeliveryFactory({ webhook: testWebhook }, em);
    deliveryRepo.findPendingDeliveries.mockResolvedValue([delivery]);
    deliveryRepo.save.mockRejectedValue(new Error('Database error'));

    await expect(useCase.execute()).rejects.toThrow(BadRequestException);
  });
});
