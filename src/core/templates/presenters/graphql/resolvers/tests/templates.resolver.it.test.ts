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
    template = await useDbTemplate({ owner: user }, em);
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
            owner {
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
      expect(response.body.data.findTemplateById).toMatchObject({
        id: template.id,
        name: template.name,
        metadata: template.metadata,
        owner: {
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
    it('should fetch paginated templates', async () => {
      // Create additional template
      await useDbTemplate({}, em);

      const query = `
        query FindAllTemplates {
          findAllTemplates {
            total
            items {
              id
              name
            }
          }
        }
      `;

      const response = await request(app.getHttpServer()).post('/graphql').send({ query });

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
            owner {
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
      expect(createdTemplate.owner.id).toBe(user.id);

      // Verify database entry
      const dbTemplate = await em.findOne(Template, { id: createdTemplate.id });
      expect(dbTemplate).toBeDefined();
    });
  });

  describe('updateTemplate', () => {
    it('should update an existing template', async () => {
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

  describe('owner field resolver', () => {
    it('should resolve template owner', async () => {
      const query = `
        query GetTemplateWithOwner($id: String!) {
          findTemplateById(id: $id) {
            id
            owner {
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
      expect(response.body.data.findTemplateById.owner).toMatchObject({
        id: user.id,
        email: user.email,
      });
    });
  });
});
