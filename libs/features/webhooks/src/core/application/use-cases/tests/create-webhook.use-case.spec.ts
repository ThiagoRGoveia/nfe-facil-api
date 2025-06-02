import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { WebhookDbPort } from '../../ports/webhook-db.port';
import { CreateWebhookUseCase } from '../create-webhook.use-case';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { CreateWebhookDto } from '../../dtos/create-webhook.dto';
import { BadRequestException } from '@nestjs/common';
import { EncryptionPort } from 'libs/tooling/encryption/src/core/ports/encryption.port';
import { ConfigService } from '@nestjs/config';
import { WebhookAuthType } from '@/core/webhooks/domain/entities/webhook.entity';
import { WebhookEvent } from '@/core/webhooks/domain/entities/webhook.entity';

describe('CreateWebhookUseCase', () => {
  let useCase: CreateWebhookUseCase;
  let webhookDbPort: jest.Mocked<WebhookDbPort>;
  let encryptionPort: jest.Mocked<EncryptionPort>;
  let configService: jest.Mocked<ConfigService>;
  let em: EntityManager;
  let testUser: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        CreateWebhookUseCase,
        {
          provide: WebhookDbPort,
          useValue: createMock<WebhookDbPort>({
            create: jest.fn().mockImplementation((data) => ({ ...data, id: 1 })),
            save: jest.fn().mockResolvedValue(undefined),
          }),
        },
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn().mockReturnValue('development'),
      })
      .overrideProvider(EncryptionPort)
      .useValue(
        createMock<EncryptionPort>({
          encrypt: jest.fn().mockReturnValue('encrypted-config'),
        }),
      )
      .compile();

    useCase = module.get<CreateWebhookUseCase>(CreateWebhookUseCase);
    webhookDbPort = module.get(WebhookDbPort);
    encryptionPort = module.get(EncryptionPort);
    configService = module.get(ConfigService);
    em = module.get(EntityManager);

    testUser = useUserFactory({ id: '1' }, em);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const validDto: CreateWebhookDto = {
    name: 'Test Webhook',
    url: 'https://example.com/webhook',
    events: [WebhookEvent.DOCUMENT_PROCESSED],
    authType: WebhookAuthType.NONE,
  };

  it('should create webhook with basic auth config', async () => {
    const dto: CreateWebhookDto = {
      ...validDto,
      authType: WebhookAuthType.BASIC,
      authConfig: { username: 'user', password: 'pass' },
    };

    const result = await useCase.execute({ user: testUser, data: dto });

    expect(webhookDbPort.create).toHaveBeenCalledWith(
      expect.objectContaining({
        authType: WebhookAuthType.BASIC,
        encryptedConfig: 'encrypted-config',
      }),
    );
    expect(encryptionPort.encrypt).toHaveBeenCalledWith(JSON.stringify(dto.authConfig));
    expect(webhookDbPort.save).toHaveBeenCalled();
    expect(result).toHaveProperty('id', 1);
  });

  it('should create webhook with OAuth2 config', async () => {
    const dto: CreateWebhookDto = {
      ...validDto,
      authType: WebhookAuthType.OAUTH2,
      authConfig: { username: 'client', password: 'secret' },
    };

    await useCase.execute({ user: testUser, data: dto });

    expect(webhookDbPort.create).toHaveBeenCalledWith(
      expect.objectContaining({
        authType: WebhookAuthType.OAUTH2,
        encryptedConfig: 'encrypted-config',
      }),
    );
  });

  it('should enforce HTTPS in production', async () => {
    (configService.get as jest.Mock).mockReturnValue('production');
    const dto: CreateWebhookDto = {
      ...validDto,
      url: 'http://insecure.com/webhook',
    };

    await expect(useCase.execute({ user: testUser, data: dto })).rejects.toThrow(BadRequestException);
  });

  it('should store custom headers', async () => {
    const dto: CreateWebhookDto = {
      ...validDto,
      headers: { 'X-Custom-Header': 'value' },
    };

    await useCase.execute({ user: testUser, data: dto });

    expect(webhookDbPort.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { 'X-Custom-Header': 'value' },
      }),
    );
  });

  it('should handle database errors', async () => {
    const error = new BadRequestException('Database failure');
    webhookDbPort.save.mockRejectedValue(error);

    await expect(useCase.execute({ user: testUser, data: validDto })).rejects.toThrow(BadRequestException);
  });
});
