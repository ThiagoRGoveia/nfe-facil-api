import request from 'supertest';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { UserRole } from '@lib/users/core/domain/entities/user.entity';
import { useRestModule } from '@dev-modules/dev-modules/tests/rest-integration-test.module';
import { createMock } from '@golevelup/ts-jest';
import { Webhook, WebhookAuthType, WebhookStatus } from '@lib/webhooks/core/domain/entities/webhook.entity';
import { HttpClientPort } from '@lib/webhooks/core/application/ports/http-client.port';
import { NotifyWebhookUseCase, WebhooksModule } from '@lib/webhooks/core/webhooks.module';
import { useDbUser } from '@lib/users/core/infra/tests/factories/users.factory';
import { useDbWebhook } from '@lib/webhooks/core/infra/tests/factories/webhooks.factory';
import { WebhookEvent } from '@lib/documents/core/application/dtos/webhook-events.dto';

jest.setTimeout(100000);
describe('WebhooksController (REST Integration)', () => {
  let app: INestApplication;
  let em: EntityManager;
  let user: User;
  let webhook: Webhook;
  let httpClient: jest.Mocked<HttpClientPort>;
  let notifyUseCase: jest.Mocked<NotifyWebhookUseCase>;

  beforeEach(async () => {
    httpClient = createMock<HttpClientPort>({
      request: jest.fn().mockResolvedValue({ status: 200, data: {}, headers: {} }),
    });

    const module: TestingModule = await Test.createTestingModule({
      imports: [useRestModule(() => user), WebhooksModule],
    })
      .overrideProvider(HttpClientPort)
      .useValue(httpClient)
      .compile();

    em = module.get<EntityManager>(EntityManager);
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

    await app.init();

    // Create test user and webhook
    user = await useDbUser({ role: UserRole.ADMIN }, em);

    notifyUseCase = module.get(NotifyWebhookUseCase);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /webhooks', () => {
    it('should create a new webhook', async () => {
      const createDto = {
        name: 'Test Webhook',
        url: 'https://new-webhook.example.com',
        events: ['DOCUMENT_PROCESSED'],
        authType: 'NONE',
        authConfig: undefined,
        headers: { 'X-Custom-Header': 'value' },
        maxRetries: 3,
        timeout: 3000,
      };

      const { body } = await request(app.getHttpServer()).post('/webhooks').send(createDto).expect(HttpStatus.CREATED);

      expect(body).toMatchObject({
        url: createDto.url,
        events: createDto.events,
        user: { id: user.id },
      });

      // Verify database entry
      const dbWebhook = await em.findOne(Webhook, { id: body.id });
      expect(dbWebhook).toBeDefined();
      expect(dbWebhook?.name).toBe(createDto.name);
    });
  });

  describe('GET /webhooks/:id', () => {
    it('should retrieve a webhook by ID', async () => {
      webhook = await useDbWebhook({ user: user }, em);
      const { body } = await request(app.getHttpServer()).get(`/webhooks/${webhook.id}`).expect(HttpStatus.OK);

      expect(body).toMatchObject({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
      });
    });

    it('should return 404 for non-existent webhook', async () => {
      await request(app.getHttpServer()).get('/webhooks/99999').expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /webhooks', () => {
    it('should list all webhooks for admin', async () => {
      await useDbWebhook({ user: user }, em);
      await useDbWebhook({ user: user }, em);

      const { body } = await request(app.getHttpServer()).get('/webhooks').expect(HttpStatus.OK);

      expect(body.total).toBe(2);
      expect(body.items).toHaveLength(2);
    });

    it('should filter by user for non-admin', async () => {
      const regularUser = await useDbUser({ role: UserRole.CUSTOMER }, em);
      user = regularUser;

      await request(app.getHttpServer())
        .get('/webhooks')
        .expect(HttpStatus.OK)
        .then(({ body }) => {
          expect(body.total).toBe(0);
        });
    });
  });

  describe('PUT /webhooks/:id', () => {
    it('should update a webhook', async () => {
      webhook = await useDbWebhook({ user: user }, em);
      const updateDto = {
        url: 'https://updated-webhook.example.com',
        events: ['DOCUMENT_PROCESSED'],
        active: false,
      };

      const { body } = await request(app.getHttpServer())
        .put(`/webhooks/${webhook.id}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(body).toMatchObject({
        url: updateDto.url,
        events: updateDto.events,
      });

      // Verify database update
      em.clear();
      const updatedWebhook = await em.findOne(Webhook, { id: webhook.id });
      expect(updatedWebhook?.url).toBe(updateDto.url);
    });
  });

  describe('DELETE /webhooks/:id', () => {
    it('should delete a webhook', async () => {
      webhook = await useDbWebhook({ user: user }, em);
      await request(app.getHttpServer()).delete(`/webhooks/${webhook.id}`).expect(HttpStatus.NO_CONTENT);

      // Verify deletion
      em.clear();
      const deletedWebhook = await em.findOne(Webhook, { id: webhook.id });
      expect(deletedWebhook).toBeNull();
    });
  });

  describe('POST /webhooks/notify', () => {
    it('should trigger webhook notifications', async () => {
      const webhook = await useDbWebhook(
        {
          user: user,
          name: 'Test Webhook',
          url: 'https://new-webhook.example.com',
          events: [WebhookEvent.DOCUMENT_PROCESSED],
          authType: WebhookAuthType.NONE,
          headers: { 'X-Custom-Header': 'value' },
          maxRetries: 3,
          timeout: 3000,
          status: WebhookStatus.ACTIVE,
        },
        em,
      );
      const notifyData = {
        event: 'DOCUMENT_PROCESSED',
        payload: { data: 'test' },
      };
      const spy = jest.spyOn(notifyUseCase, 'execute');
      const result = await request(app.getHttpServer()).post('/webhooks/notify').send(notifyData);

      expect(result.status).toBe(HttpStatus.OK);

      expect(spy).toHaveBeenCalledWith({
        user,
        event: WebhookEvent.DOCUMENT_PROCESSED,
        payload: { data: 'test' },
      });
      expect(httpClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: webhook.url,
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'value',
        },
        body: {
          data: 'test',
        },
        timeout: 3000,
        auth: undefined,
      });
    });
  });
});
