import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { WebhookDbPort } from '../../ports/webhook-db.port';
import { DeleteWebhookUseCase } from '../delete-webhook.use-case';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { useUserFactory } from '@lib/users/core/infra/tests/factories/users.factory';
import { BadRequestException } from '@nestjs/common';
import { Webhook } from '@lib/webhooks/core/domain/entities/webhook.entity';
import { useWebhookFactory } from '@lib/webhooks/core/infra/tests/factories/webhooks.factory';

describe('DeleteWebhookUseCase', () => {
  let useCase: DeleteWebhookUseCase;
  let webhookDbPort: jest.Mocked<WebhookDbPort>;
  let em: EntityManager;
  let testUser: User;
  let testWebhook: Webhook;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        DeleteWebhookUseCase,
        {
          provide: WebhookDbPort,
          useValue: createMock<WebhookDbPort>({
            findById: jest.fn(),
            delete: jest.fn().mockResolvedValue(undefined),
          }),
        },
      ],
    }).compile();

    useCase = module.get<DeleteWebhookUseCase>(DeleteWebhookUseCase);
    webhookDbPort = module.get(WebhookDbPort);
    em = module.get(EntityManager);

    testUser = useUserFactory({ id: '1' }, em);
    testWebhook = useWebhookFactory({ user: testUser }, em);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should delete webhook successfully', async () => {
    webhookDbPort.findById.mockResolvedValue(testWebhook);

    await useCase.execute({
      id: testWebhook.id,
      user: testUser,
    });

    expect(webhookDbPort.findById).toHaveBeenCalledWith(testWebhook.id);
    expect(webhookDbPort.delete).toHaveBeenCalledWith(testWebhook.id);
  });

  it('should throw for non-existent webhook', async () => {
    webhookDbPort.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: '999',
        user: testUser,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should prevent non-owners from deleting', async () => {
    webhookDbPort.findById.mockResolvedValue(testWebhook);
    const otherUser = useUserFactory({ id: '2' }, em);

    await expect(
      useCase.execute({
        id: testWebhook.id,
        user: otherUser,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should handle database errors', async () => {
    webhookDbPort.findById.mockResolvedValue(testWebhook);
    const error = new Error('Database failure');
    webhookDbPort.delete.mockRejectedValue(error);

    await expect(
      useCase.execute({
        id: testWebhook.id,
        user: testUser,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
