import { RequiredEntityData } from '@mikro-orm/postgresql';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { WebhookMikroOrmDbRepository } from '../webhook-mikro-orm-db.repository';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { Webhook, WebhookAuthType, WebhookEvent, WebhookStatus } from '@/core/webhooks/domain/entities/webhook.entity';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';

describe('WebhookMikroOrmDbRepository (unit)', () => {
  let em: EntityManager;
  let repository: WebhookMikroOrmDbRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [WebhookMikroOrmDbRepository],
    }).compile();

    em = module.get(EntityManager);
    repository = module.get<WebhookMikroOrmDbRepository>(WebhookMikroOrmDbRepository);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findActiveByEventAndUser', () => {
    it('should find active webhooks by event and user', async () => {
      // Arrange
      const event = WebhookEvent.DOCUMENT_PROCESSED;
      const user = useUserFactory({ email: 'test@example.com' }, em);
      const findSpy = jest.spyOn(em, 'find').mockResolvedValue([new Webhook()]);

      // Act
      const result = await repository.findActiveByEventAndUser(event, user);

      // Assert
      expect(findSpy).toHaveBeenCalledWith(Webhook, {
        events: { $contains: [event] },
        status: WebhookStatus.ACTIVE,
        user,
      });
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('create', () => {
    it('should create a new webhook', () => {
      // Arrange
      const webhookData: RequiredEntityData<Webhook> = {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        status: WebhookStatus.ACTIVE,
        events: [WebhookEvent.DOCUMENT_PROCESSED],
        user: useUserFactory({ email: 'test@example.com' }, em),
        authType: WebhookAuthType.NONE,
      };
      const createSpy = jest.spyOn(em, 'create');
      const persistSpy = jest.spyOn(em, 'persist');

      // Act
      const result = repository.create(webhookData);

      // Assert
      expect(createSpy).toHaveBeenCalledWith(Webhook, webhookData);
      expect(persistSpy).toHaveBeenCalledWith(result);
      expect(result).toBeInstanceOf(Webhook);
      expect(result.name).toBe(webhookData.name);
      expect(result.url).toBe(webhookData.url);
    });
  });

  describe('update', () => {
    it('should update an existing webhook', () => {
      // Arrange
      const webhookId = '1';
      const updateData = { name: 'Updated Webhook' };
      const existingWebhook = new Webhook();
      const getReferenceSpy = jest.spyOn(em, 'getReference').mockReturnValue(existingWebhook);
      const assignSpy = jest.spyOn(em, 'assign');

      // Act
      const result = repository.update(webhookId, updateData);

      // Assert
      expect(getReferenceSpy).toHaveBeenCalledWith(Webhook, webhookId);
      expect(assignSpy).toHaveBeenCalledWith(existingWebhook, updateData);
      expect(result).toBe(existingWebhook);
    });
  });
});
