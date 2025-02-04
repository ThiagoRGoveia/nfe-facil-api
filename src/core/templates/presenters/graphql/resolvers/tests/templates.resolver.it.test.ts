import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { User } from '@/core/users/domain/entities/user.entity';
import { TemplatesResolver } from '../templates.resolver';
import { TemplatesModule } from '@/core/templates/templates.module';
import { useDbTemplate } from '@/core/templates/infra/tests/factories/templates.factory';
import { useDbUser } from '@/core/users/infra/tests/factories/users.factory';
import { useDbSchema, useDbRefresh } from '@/infra/tests/db-schema.seed';
import { useGraphqlModule } from '@/infra/tests/graphql-integration-test.module';
import { UserRole } from '@/core/users/domain/entities/user.entity';

jest.setTimeout(100000);
describe('TemplatesResolver (Integration)', () => {
  let app: INestApplication;
  let orm: MikroORM;
  let em: EntityManager;
  let user: User;
  let template: Template;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useGraphqlModule(() => user), TemplatesModule],
      providers: [TemplatesResolver],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    em = module.get<EntityManager>(EntityManager);
    app = module.createNestApplication();
    await useDbSchema(orm);
    await app.init();

    // Create test user and template
    user = await useDbUser({ role: UserRole.ADMIN }, em);
  });

  afterEach(async () => {
    await useDbRefresh(orm);
    await app.close();
  });

  describe('findTemplateById', () => {
    it('should find a template by id', async () => {
      const query = `
        query FindTemplate($id: String!) {
          findTemplateById(id: $id) {
            id
            name
            metadata
            user {
              id
              email
            }
          }
        }
      `;
      template = await useDbTemplate({ user: user }, em);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: { id: template.id },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.findTemplateById).toMatchObject({
        id: template.id,
        name: template.name,
        metadata: template.metadata,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    });

    it('should return null for non-existent template', async () => {
      const query = `
        query FindTemplate($id: String!) {
          findTemplateById(id: $id) {
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
      expect(response.body.errors[0].message).toEqual('Template not found');
      expect(response.body.data.findTemplateById).toBeNull();
    });
  });

  describe('findAllTemplates', () => {
    let regularUser: User;
    let adminUser: User;
    let adminTemplate: Template;
    let regularUserTemplate: Template;

    beforeEach(async () => {
      // Create users with different roles
      adminUser = await useDbUser({ role: UserRole.ADMIN }, em);
      regularUser = await useDbUser({ role: UserRole.CUSTOMER }, em);

      // Create templates for different users
      adminTemplate = await useDbTemplate({ user: adminUser }, em);
      regularUserTemplate = await useDbTemplate({ user: regularUser }, em);
    });

    it('should fetch all templates when user is admin', async () => {
      // Set user as admin for this test
      user = adminUser;

      const query = `
        query FindAllTemplates {
          findAllTemplates {
            total
            items {
              id
              name
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
      expect(response.body.data.findAllTemplates.total).toBe(2);
      expect(response.body.data.findAllTemplates.items).toHaveLength(2);

      // Verify that templates from both users are returned
      const templateIds = response.body.data.findAllTemplates.items.map((item) => item.id);
      expect(templateIds).toContain(adminTemplate.id);
      expect(templateIds).toContain(regularUserTemplate.id);
    });

    it('should fetch only user templates when user is not admin', async () => {
      // Set user as regular user for this test
      user = regularUser;

      const query = `
        query FindAllTemplates {
          findAllTemplates {
            total
            items {
              id
              name
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
      expect(response.body.data.findAllTemplates.total).toBe(1);
      expect(response.body.data.findAllTemplates.items).toHaveLength(1);

      // Verify that only the regular user's template is returned
      const returnedTemplate = response.body.data.findAllTemplates.items[0];
      expect(returnedTemplate.id).toBe(regularUserTemplate.id);
      expect(returnedTemplate.user.id).toBe(regularUser.id);
    });

    it('should handle pagination and filters correctly for regular users', async () => {
      // Set user as regular user for this test
      user = regularUser;

      // Create additional templates for the regular user
      await useDbTemplate({ user: regularUser, name: 'Template A' }, em);
      await useDbTemplate({ user: regularUser, name: 'Template B' }, em);

      const query = `
        query FindAllTemplates($pagination: Pagination, $filters: Filters) {
          findAllTemplates(pagination: $pagination, filters: $filters) {
            total
            items {
              id
              name
            }
          }
        }
      `;

      const variables = {
        pagination: { page: 1, pageSize: 2 },
        filters: { filters: [{ field: 'name', ilike: 'Template' }] },
      };

      const response = await request(app.getHttpServer()).post('/graphql').send({ query, variables });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.findAllTemplates.total).toBe(2);
      expect(response.body.data.findAllTemplates.items).toHaveLength(2);
    });
  });

  describe('createTemplate', () => {
    it('should create a new template', async () => {
      const mutation = `
        mutation CreateTemplate($input: CreateTemplateDto!) {
          createTemplate(input: $input) {
            id
            name
            metadata
            user {
              id
            }
          }
        }
      `;

      const templateData = {
        name: 'New Template',
        metadata: { fields: ['date', 'total', 'items'] },
        processCode: 'invoice-processing',
        outputFormat: 'json',
        isPublic: true,
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { input: templateData },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      const createdTemplate = response.body.data.createTemplate;
      expect(createdTemplate.name).toBe(templateData.name);
      expect(createdTemplate.user.id).toBe(user.id);

      // Verify database entry
      const dbTemplate = await em.findOne(Template, { id: createdTemplate.id });
      expect(dbTemplate).toBeDefined();
    });
  });

  describe('updateTemplate', () => {
    it('should update an existing template', async () => {
      template = await useDbTemplate({ user: user }, em);
      const mutation = `
        mutation UpdateTemplate($id: String!, $input: UpdateTemplateDto!) {
          updateTemplate(id: $id, input: $input) {
            id
            name
            processCode
            metadata
            outputFormat
          }
        }
      `;

      const updateData = {
        name: 'Updated Name',
        processCode: 'new-process',
        metadata: { fields: ['updated'] },
        outputFormat: 'xml',
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            id: template.id,
            input: updateData,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.updateTemplate).toMatchObject(updateData);

      // Verify database update
      // Clear the entity manager cache
      em.clear();
      const updatedTemplate = await em.findOne(Template, { id: template.id });
      expect(updatedTemplate?.name).toBe(updateData.name);
      expect(updatedTemplate?.processCode).toBe(updateData.processCode);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template', async () => {
      template = await useDbTemplate({ user: user }, em);
      const mutation = `
        mutation DeleteTemplate($id: String!) {
          deleteTemplate(id: $id)
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { id: template.id },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.deleteTemplate).toBe(true);

      // Verify deletion
      // Clear the entity manager cache
      em.clear();
      const deletedTemplate = await em.findOne(Template, { id: template.id });
      expect(deletedTemplate).toBeNull();
    });
  });

  describe('user field resolver', () => {
    it('should resolve template user', async () => {
      template = await useDbTemplate({ user: user }, em);
      const query = `
        query GetTemplateWithuser($id: String!) {
          findTemplateById(id: $id) {
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
          variables: { id: template.id },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.findTemplateById.user).toMatchObject({
        id: user.id,
        email: user.email,
      });
    });
  });
});
