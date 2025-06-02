import { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { WebhookMikroOrmDbRepository } from '../webhook-mikro-orm-db.repository';
import { BaseIntegrationTestModule } from '@/infra/tests/base-integration-test.module';

import { Webhook, WebhookAuthType, WebhookEvent, WebhookStatus } from '@/core/webhooks/domain/entities/webhook.entity';
import { useDbWebhook } from '@/core/webhooks/infra/tests/factories/webhooks.factory';
import { useDbUser } from '@/core/users/infra/tests/factories/users.factory';
import { User } from '@lib/users/core/domain/entities/user.entity';
describe('WebhookMikroOrmDbRepository (integration)', () => {
  let app: INestApplication;
  let orm: MikroORM;
  let em: EntityManager;
  let repository: WebhookMikroOrmDbRepository;
  let testWebhook: Webhook;
  let testUser: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BaseIntegrationTestModule],
      providers: [WebhookMikroOrmDbRepository],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    em = orm.em as EntityManager;
    repository = module.get<WebhookMikroOrmDbRepository>(WebhookMikroOrmDbRepository);
    app = module.createNestApplication();

    await app.init();

    testUser = await useDbUser(
      {
        email: 'test@example.com',
      },
      em,
    );

    testWebhook = await useDbWebhook(
      {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        status: WebhookStatus.ACTIVE,
        events: [WebhookEvent.DOCUMENT_PROCESSED],
        user: testUser,
        authType: WebhookAuthType.NONE,
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

  describe('findActiveByEventAndUser', () => {
    it('should find active webhooks by event and user', async () => {
      // Create webhook from different user
      const otherUser = await useDbUser({ email: 'other@example.com' }, em);
      await useDbWebhook(
        {
          status: WebhookStatus.ACTIVE,
          events: [WebhookEvent.DOCUMENT_PROCESSED],
          user: otherUser,
        },
        em,
      );

      const results = await repository.findActiveByEventAndUser(WebhookEvent.DOCUMENT_PROCESSED, testUser);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(testWebhook.id);
      expect(results[0].user.id).toBe(testUser.id);
    });

    it('should return empty array when no active webhooks for event/user combo', async () => {
      const results = await repository.findActiveByEventAndUser(
        WebhookEvent.DOCUMENT_PROCESSED,
        await useDbUser({ email: 'other@example.com' }, em),
      );
      expect(results).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('should create a new webhook', async () => {
      const webhookData = {
        name: 'New Webhook',
        url: 'https://new.example.com/webhook',
        status: WebhookStatus.ACTIVE,
        events: [WebhookEvent.DOCUMENT_PROCESSED],
        user: testUser,
        authType: WebhookAuthType.NONE,
      };

      const webhook = repository.create(webhookData);
      await em.persistAndFlush(webhook);

      expect(webhook.id).toBeDefined();
      expect(webhook.name).toBe(webhookData.name);
      expect(webhook.url).toBe(webhookData.url);
      expect(webhook.status).toBe(WebhookStatus.ACTIVE);
    });
  });

  describe('update', () => {
    it('should update an existing webhook', async () => {
      const updateData = {
        name: 'Updated Webhook',
        status: WebhookStatus.INACTIVE,
      };

      const updatedWebhook = repository.update(testWebhook.id, updateData);
      await em.persistAndFlush(updatedWebhook);

      expect(updatedWebhook.id).toBe(testWebhook.id);
      expect(updatedWebhook.name).toBe(updateData.name);
      expect(updatedWebhook.status).toBe(updateData.status);
    });
  });
});
