import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Webhook, WebhookStatus } from '@/core/webhooks/domain/entities/webhook.entity';
import { User } from '@/core/users/domain/entities/user.entity';
import { WebhooksResolver } from '../webhooks.resolver';
import { useDbWebhook } from '@/core/webhooks/infra/tests/factories/webhooks.factory';
import { useDbUser } from '@/core/users/infra/tests/factories/users.factory';
import { useGraphqlModule } from '@/infra/tests/graphql-integration-test.module';
import { UserRole } from '@/core/users/domain/entities/user.entity';
import { WebhooksModule } from '@/core/webhooks/webhooks.module';

jest.setTimeout(100000);
describe('WebhooksResolver (Integration)', () => {
  let app: INestApplication;
  let em: EntityManager;
  let user: User;
  let webhook: Webhook;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useGraphqlModule(() => user), WebhooksModule],
      providers: [WebhooksResolver],
    }).compile();

    em = module.get<EntityManager>(EntityManager);
    app = module.createNestApplication();

    await app.init();

    // Create test user and webhook
    user = await useDbUser({ role: UserRole.ADMIN }, em);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('findWebhookById', () => {
    it('should find a webhook by id', async () => {
      webhook = await useDbWebhook({ user }, em);
      const query = `
        query FindWebhook($id: String!) {
          findWebhookById(id: $id) {
            id
            url
            events
            user {
              id
              email
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: { id: webhook.id },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.findWebhookById).toMatchObject({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    });

    it('should return null for non-existent webhook', async () => {
      const query = `
        query FindWebhook($id: String!) {
          findWebhookById(id: $id) {
            id
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: { id: '99999' },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors[0].message).toEqual('Webhook not found');
      expect(response.body.data.findWebhookById).toBeNull();
    });
  });

  describe('findAllWebhooks', () => {
    let regularUser: User;
    let adminUser: User;
    let adminWebhook: Webhook;
    let regularUserWebhook: Webhook;

    beforeEach(async () => {
      // Create users with different roles
      adminUser = await useDbUser({ role: UserRole.ADMIN }, em);
      regularUser = await useDbUser({ role: UserRole.CUSTOMER }, em);

      // Create webhooks for different users
      adminWebhook = await useDbWebhook({ user: adminUser }, em);
      regularUserWebhook = await useDbWebhook({ user: regularUser }, em);
    });

    it('should fetch all webhooks when user is admin', async () => {
      // Set user as admin for this test
      user = adminUser;

      const query = `
        query FindAllWebhooks {
          findAllWebhooks {
            total
            items {
              id
              url
              user {
                id
                role
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.findAllWebhooks.total).toBe(2);
      expect(response.body.data.findAllWebhooks.items).toHaveLength(2);

      // Verify webhooks from both users are returned
      const webhookIds = response.body.data.findAllWebhooks.items.map((item) => item.id);
      expect(webhookIds).toContain(adminWebhook.id);
      expect(webhookIds).toContain(regularUserWebhook.id);
    });

    it('should fetch only user webhooks when user is not admin', async () => {
      // Set user as regular user for this test
      user = regularUser;

      const query = `
        query FindAllWebhooks {
          findAllWebhooks {
            total
            items {
              id
              url
              user {
                id
                role
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.findAllWebhooks.total).toBe(1);
      expect(response.body.data.findAllWebhooks.items).toHaveLength(1);

      // Verify only the regular user's webhook is returned
      const returnedWebhook = response.body.data.findAllWebhooks.items[0];
      expect(returnedWebhook.id).toBe(regularUserWebhook.id);
      expect(returnedWebhook.user.id).toBe(regularUser.id);
    });

    it('should handle pagination and filters correctly for regular users', async () => {
      // Set user as regular user for this test
      user = regularUser;

      // Create additional webhooks for the regular user
      await useDbWebhook({ user: regularUser, url: 'https://webhook-a.example.com' }, em);
      await useDbWebhook({ user: regularUser, url: 'https://webhook-b.example.com' }, em);

      const query = `
        query FindAllWebhooks($pagination: Pagination, $filters: Filters) {
          findAllWebhooks(pagination: $pagination, filters: $filters) {
            total
            items {
              id
              url
            }
          }
        }
      `;

      const variables = {
        pagination: { page: 1, pageSize: 2 },
        filters: { filters: [{ field: 'url', ilike: 'webhook' }] },
      };

      const response = await request(app.getHttpServer()).post('/graphql').send({ query, variables });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.findAllWebhooks.total).toBe(2);
      expect(response.body.data.findAllWebhooks.items).toHaveLength(2);
    });
  });

  describe('createWebhook', () => {
    it('should create a new webhook', async () => {
      const mutation = `
        mutation CreateWebhook($input: CreateWebhookDto!) {
          createWebhook(input: $input) {
            id
            url
            events
            user {
              id
            }
            authType
            maxRetries
          }
        }
      `;

      const webhookData = {
        name: 'Test Webhook',
        url: 'https://new-webhook.example.com',
        events: ['DOCUMENT_PROCESSED'],
        authType: 'NONE',
        authConfig: null,
        headers: { 'X-Custom-Header': 'value' },
        maxRetries: 3,
        timeout: 3000,
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { input: webhookData },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      const createdWebhook = response.body.data.createWebhook;
      expect(createdWebhook.url).toBe(webhookData.url);
      expect(createdWebhook.user.id).toBe(user.id);
      expect(createdWebhook.authType).toBe(webhookData.authType);
      expect(createdWebhook.maxRetries).toBe(webhookData.maxRetries);

      // Verify database entry
      const dbWebhook = await em.findOne(Webhook, { id: createdWebhook.id });
      expect(dbWebhook).toBeDefined();
      expect(dbWebhook?.name).toBe(webhookData.name);
    });
  });

  describe('updateWebhook', () => {
    it('should update an existing webhook', async () => {
      webhook = await useDbWebhook({ user }, em);
      const mutation = `
        mutation UpdateWebhook($id: String!, $input: UpdateWebhookDto!) {
          updateWebhook(id: $id, input: $input) {
            id
            url
            events
            status
            authType
            maxRetries
            timeout
            name
          }
        }
      `;

      const updateData = {
        url: 'https://updated-webhook.example.com',
        events: ['DOCUMENT_PROCESSED'],
        active: false,
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            id: webhook.id,
            input: updateData,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.updateWebhook).toMatchObject({
        url: updateData.url,
        events: updateData.events,
        status: WebhookStatus.INACTIVE,
        authType: webhook.authType,
        maxRetries: webhook.maxRetries,
        timeout: webhook.timeout,
        name: webhook.name,
      });

      // Verify database update
      em.clear();
      const updatedWebhook = await em.findOne(Webhook, { id: webhook.id });
      expect(updatedWebhook?.url).toBe(updateData.url);
      expect(updatedWebhook?.isActive()).toBe(false);
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook', async () => {
      webhook = await useDbWebhook({ user }, em);
      const mutation = `
        mutation DeleteWebhook($id: String!) {
          deleteWebhook(id: $id)
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { id: webhook.id },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.deleteWebhook).toBe(true);

      // Verify deletion
      em.clear();
      const deletedWebhook = await em.findOne(Webhook, { id: webhook.id });
      expect(deletedWebhook).toBeNull();
    });
  });

  describe('user field resolver', () => {
    it('should resolve webhook user', async () => {
      webhook = await useDbWebhook({ user }, em);
      const query = `
        query GetWebhookWithuser($id: String!) {
          findWebhookById(id: $id) {
            id
            user {
              id
              email
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: { id: webhook.id },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.findWebhookById.user).toMatchObject({
        id: user.id,
        email: user.email,
      });
    });
  });
});
