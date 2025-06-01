import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { WebhookDbPort } from '../../ports/webhook-db.port';
import { UpdateWebhookUseCase } from '../update-webhook.use-case';
import { User } from '@/core/users/domain/entities/user.entity';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { UpdateWebhookDto } from '../../dtos/update-webhook.dto';
import { BadRequestException } from '@nestjs/common';
import { Webhook } from '@/core/webhooks/domain/entities/webhook.entity';
import { WebhookEvent } from '@/core/webhooks/domain/entities/webhook.entity';
import { useWebhookFactory } from '@/core/webhooks/infra/tests/factories/webhooks.factory';
import { WebhookStatus } from '@/core/webhooks/domain/entities/webhook.entity';

describe('UpdateWebhookUseCase', () => {
  let useCase: UpdateWebhookUseCase;
  let webhookDbPort: jest.Mocked<WebhookDbPort>;
  let em: EntityManager;
  let testUser: User;
  let testWebhook: Webhook;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        UpdateWebhookUseCase,
        {
          provide: WebhookDbPort,
          useValue: createMock<WebhookDbPort>({
            findById: jest.fn(),
            update: jest.fn().mockImplementation((id, data) => ({
              ...testWebhook,
              ...data,
              activate: jest.fn(),
              deactivate: jest.fn(),
            })),
            save: jest.fn().mockResolvedValue(undefined),
          }),
        },
      ],
    }).compile();

    useCase = module.get<UpdateWebhookUseCase>(UpdateWebhookUseCase);
    webhookDbPort = module.get(WebhookDbPort);
    em = module.get(EntityManager);

    testUser = useUserFactory({ id: '1' }, em);
    testWebhook = useWebhookFactory(
      {
        user: testUser,
        status: WebhookStatus.ACTIVE,
      },
      em,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const validDto: UpdateWebhookDto = {
    name: 'Updated Webhook',
    url: 'https://updated.example.com',
    events: [WebhookEvent.DOCUMENT_PROCESSED],
    active: true,
  };

  function getUpdatedWebhook(): Webhook {
    em.clear();
    return useWebhookFactory(
      {
        ...testWebhook,
        ...validDto,
      },
      em,
    );
  }

  it('should update webhook successfully', async () => {
    webhookDbPort.findById.mockResolvedValue(testWebhook);
    webhookDbPort.update.mockReturnValue(getUpdatedWebhook());

    await useCase.execute({
      id: testWebhook.id,
      data: validDto,
      user: testUser,
    });

    expect(webhookDbPort.update).toHaveBeenCalledWith(
      testWebhook.id,
      expect.objectContaining({
        active: validDto.active,
        name: validDto.name,
        url: validDto.url,
        events: validDto.events,
      }),
    );
    expect(webhookDbPort.save).toHaveBeenCalled();
  });

  it('should prevent non-owners from updating', async () => {
    const otherUser = useUserFactory({ id: '2' }, em);
    webhookDbPort.findById.mockResolvedValue(testWebhook);

    await expect(
      useCase.execute({
        id: testWebhook.id,
        data: validDto,
        user: otherUser,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw for non-existent webhook', async () => {
    webhookDbPort.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: '999',
        data: validDto,
        user: testUser,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should update active status', async () => {
    webhookDbPort.findById.mockResolvedValue(testWebhook);
    const updatedWebhook = getUpdatedWebhook();
    webhookDbPort.update.mockReturnValue(updatedWebhook);
    const deactivateDto: UpdateWebhookDto = { ...validDto, active: false };
    const spy = jest.spyOn(updatedWebhook, 'deactivate');

    await useCase.execute({
      id: testWebhook.id,
      data: deactivateDto,
      user: testUser,
    });

    expect(spy).toHaveBeenCalled();
    expect(webhookDbPort.save).toHaveBeenCalled();
  });

  it('should handle database errors', async () => {
    webhookDbPort.findById.mockResolvedValue(testWebhook);
    webhookDbPort.update.mockReturnValue(getUpdatedWebhook());
    const error = new Error('Database failure');
    webhookDbPort.save.mockRejectedValue(error);

    await expect(
      useCase.execute({
        id: testWebhook.id,
        data: validDto,
        user: testUser,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
