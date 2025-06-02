import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@dev-modules/dev-modules/tests/base-unit-test.module';
import { NotifyWebhookUseCase } from '../notify-webhook.use-case';
import { Webhook, WebhookEvent, WebhookStatus } from '@lib/webhooks/core/domain/entities/webhook.entity';
import { WebhookDeliveryStatus } from '@lib/webhooks/core/domain/entities/webhook-delivery.entity';
import { useWebhookFactory } from '@lib/webhooks/core/infra/tests/factories/webhooks.factory';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { useUserFactory } from '@lib/users/core/infra/tests/factories/users.factory';
import { useWebhookDeliveryFactory } from '@lib/webhooks/core/infra/tests/factories/webhook-deliveries.factory';
import { BadRequestException } from '@nestjs/common';
import { DatePort } from '@lib/date/core/date.adapter';
import { WebhookDispatcherPort } from '../../ports/webhook-dispatcher.port';
import { WebhookDbPort } from '@lib/webhooks/core/application/ports/webhook-db.port';
import { WebhookDeliveryDbPort } from '../../ports/webhook-delivery-db.port';

describe('NotifyWebhookUseCase', () => {
  let useCase: NotifyWebhookUseCase;
  let webhookDbPort: jest.Mocked<WebhookDbPort>;
  let deliveryDbPort: jest.Mocked<WebhookDeliveryDbPort>;
  let dispatcherPort: jest.Mocked<WebhookDispatcherPort>;
  let em: EntityManager;
  let testUser: User;
  let testWebhook: Webhook;
  let datePort: jest.Mocked<DatePort>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        NotifyWebhookUseCase,
        {
          provide: WebhookDbPort,
          useValue: createMock<WebhookDbPort>({}),
        },
        {
          provide: WebhookDeliveryDbPort,
          useValue: createMock<WebhookDeliveryDbPort>({
            create: jest.fn(),
            update: jest.fn(),
            save: jest.fn(),
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

    useCase = module.get<NotifyWebhookUseCase>(NotifyWebhookUseCase);
    webhookDbPort = module.get(WebhookDbPort);
    deliveryDbPort = module.get(WebhookDeliveryDbPort);
    dispatcherPort = module.get(WebhookDispatcherPort);
    datePort = module.get(DatePort);
    em = module.get(EntityManager);

    testUser = useUserFactory({ id: '1' }, em);
    testWebhook = useWebhookFactory(
      {
        user: testUser,
        events: [WebhookEvent.DOCUMENT_PROCESSED],
        status: WebhookStatus.ACTIVE,
      },
      em,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const testEvent = WebhookEvent.DOCUMENT_PROCESSED;
  const testPayload = { data: 'test' };

  it('should process successful webhook delivery', async () => {
    webhookDbPort.findActiveByEventAndUser.mockResolvedValue([testWebhook]);
    dispatcherPort.dispatch.mockResolvedValue(undefined);

    const testDelivery = useWebhookDeliveryFactory(
      {
        webhook: testWebhook,
        payload: testPayload,
      },
      em,
    );

    deliveryDbPort.create.mockReturnValue(testDelivery);

    await useCase.execute({ event: testEvent, payload: testPayload, user: testUser });

    expect(deliveryDbPort.create).toHaveBeenCalledWith(
      expect.objectContaining({
        webhook: testWebhook,
        payload: testPayload,
        retryCount: 0,
        lastError: null,
        lastAttempt: null,
      }),
    );
    expect(dispatcherPort.dispatch).toHaveBeenCalledWith(testDelivery);
  });

  it('should handle failed webhook delivery', async () => {
    webhookDbPort.findActiveByEventAndUser.mockResolvedValue([testWebhook]);
    const testError = new Error('Dispatch failed');
    dispatcherPort.dispatch.mockRejectedValue(testError);

    const testDelivery = useWebhookDeliveryFactory(
      {
        webhook: testWebhook,
        payload: testPayload,
      },
      em,
    );

    deliveryDbPort.create.mockReturnValue(testDelivery);
    const mockDate = new Date();
    datePort.now.mockReturnValue(mockDate);

    await useCase.execute({ event: testEvent, payload: testPayload, user: testUser });

    expect(deliveryDbPort.update).toHaveBeenCalledWith(testDelivery.id, {
      status: WebhookDeliveryStatus.FAILED,
      retryCount: 1,
      lastError: testError.message,
      lastAttempt: mockDate,
    });
  });

  it('should handle no active webhooks', async () => {
    webhookDbPort.findActiveByEventAndUser.mockResolvedValue([]);

    await useCase.execute({
      event: testEvent,
      payload: testPayload,
      user: testUser,
    });

    expect(deliveryDbPort.create).not.toHaveBeenCalled();
    expect(dispatcherPort.dispatch).not.toHaveBeenCalled();
  });

  it('should handle multiple webhooks', async () => {
    const secondWebhook = useWebhookFactory({ user: testUser, events: [testEvent] }, em);
    webhookDbPort.findActiveByEventAndUser.mockResolvedValue([testWebhook, secondWebhook]);
    dispatcherPort.dispatch.mockResolvedValue(undefined);

    const delivery1 = useWebhookDeliveryFactory({ webhook: testWebhook }, em);
    const delivery2 = useWebhookDeliveryFactory({ webhook: secondWebhook }, em);

    deliveryDbPort.create.mockImplementationOnce(() => delivery1).mockImplementationOnce(() => delivery2);

    await useCase.execute({ event: testEvent, payload: testPayload, user: testUser });

    expect(deliveryDbPort.create).toHaveBeenCalledTimes(2);
    expect(dispatcherPort.dispatch).toHaveBeenCalledWith(delivery1);
    expect(dispatcherPort.dispatch).toHaveBeenCalledWith(delivery2);
  });

  it('should handle database errors', async () => {
    webhookDbPort.findActiveByEventAndUser.mockResolvedValue([testWebhook]);
    const testDelivery = useWebhookDeliveryFactory(
      {
        webhook: testWebhook,
        payload: testPayload,
      },
      em,
    );

    deliveryDbPort.create.mockReturnValue(testDelivery);
    const dbError = new Error('Database failure');
    deliveryDbPort.save.mockRejectedValue(dbError);

    await expect(
      useCase.execute({
        event: testEvent,
        payload: testPayload,
        user: testUser,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
