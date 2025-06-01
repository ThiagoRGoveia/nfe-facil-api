import { RequiredEntityData } from '@mikro-orm/postgresql';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { WebhookDeliveryMikroOrmDbRepository } from '../webhook-delivery-mikro-orm-db.repository';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { WebhookDelivery, WebhookDeliveryStatus } from '@/core/webhooks/domain/entities/webhook-delivery.entity';
import { useWebhookFactory } from '@/core/webhooks/infra/tests/factories/webhooks.factory';

describe('WebhookDeliveryMikroOrmDbRepository (unit)', () => {
  let em: EntityManager;
  let repository: WebhookDeliveryMikroOrmDbRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [WebhookDeliveryMikroOrmDbRepository],
    }).compile();

    em = module.get(EntityManager);
    repository = module.get<WebhookDeliveryMikroOrmDbRepository>(WebhookDeliveryMikroOrmDbRepository);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findPendingDeliveries', () => {
    it('should find pending deliveries with nextAttempt <= now', async () => {
      // Arrange
      const findSpy = jest.spyOn(em, 'find').mockResolvedValue([new WebhookDelivery()]);

      // Act
      const result = await repository.findPendingDeliveries();

      // Assert
      expect(findSpy).toHaveBeenCalledWith(WebhookDelivery, {
        status: { $in: [WebhookDeliveryStatus.PENDING, WebhookDeliveryStatus.RETRY_PENDING] },
        nextAttempt: { $lte: expect.any(Date) },
      });
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('create', () => {
    it('should create a new delivery', () => {
      // Arrange
      const deliveryData: RequiredEntityData<WebhookDelivery> = {
        webhook: useWebhookFactory({}, em),
        payload: {},
        status: WebhookDeliveryStatus.PENDING,
        nextAttempt: new Date(),
        retryCount: 0,
      };
      const createSpy = jest.spyOn(em, 'create');
      const persistSpy = jest.spyOn(em, 'persist');

      // Act
      const result = repository.create(deliveryData);

      // Assert
      expect(createSpy).toHaveBeenCalledWith(WebhookDelivery, deliveryData);
      expect(persistSpy).toHaveBeenCalledWith(result);
      expect(result).toBeInstanceOf(WebhookDelivery);
    });
  });

  describe('update', () => {
    it('should update an existing delivery', () => {
      // Arrange
      const deliveryId = '1';
      const updateData = { status: WebhookDeliveryStatus.SUCCESS };
      const existingDelivery = new WebhookDelivery();
      const getReferenceSpy = jest.spyOn(em, 'getReference').mockReturnValue(existingDelivery);
      const assignSpy = jest.spyOn(em, 'assign');

      // Act
      const result = repository.update(deliveryId, updateData);

      // Assert
      expect(getReferenceSpy).toHaveBeenCalledWith(WebhookDelivery, deliveryId);
      expect(assignSpy).toHaveBeenCalledWith(existingDelivery, updateData);
      expect(result).toBe(existingDelivery);
    });
  });
});
