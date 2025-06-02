import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Template } from '@lib/templates/core/domain/entities/template.entity';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { useDbTemplate } from '@lib/templates/core/infra/tests/factories/templates.factory';
import { useDbUser } from '@lib/users/core/infra/tests/factories/users.factory';
import { UserRole } from '@lib/users/core/domain/entities/user.entity';
import { TemplatesModule } from '@lib/templates/templates.module';
import { CreateTemplateDto } from '@lib/templates/core/application/dtos/create-template.dto';
import { useRestModule } from '@dev-modules/dev-modules/tests/rest-integration-test.module';
import { UpdateTemplateDto } from '@lib/templates/core/application/dtos/update-template.dto';

jest.setTimeout(100000);
describe('TemplateController (REST Integration)', () => {
  let app: INestApplication;
  let em: EntityManager;
  let user: User;
  let template: Template;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useRestModule(() => user), TemplatesModule],
    }).compile();

    em = module.get<EntityManager>(EntityManager);
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

    await app.init();

    // Create test user and template
    user = await useDbUser({ role: UserRole.ADMIN }, em);
    template = await useDbTemplate({ user: user }, em);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /templates', () => {
    it('should create a new template', async () => {
      const createDto: CreateTemplateDto = {
        name: 'New REST Template',
        metadata: { fields: ['date', 'total'] },
        processCode: 'rest-process',
        outputFormat: 'json',
        isPublic: true,
      };

      const { body, statusCode } = await request(app.getHttpServer()).post('/templates').send(createDto);

      expect(statusCode).toBe(201);

      expect(body).toMatchObject({
        name: createDto.name,
        processCode: createDto.processCode,
        user: { id: user.id },
      });

      // Verify database entry
      const dbTemplate = await em.findOne(Template, { id: body.id });
      expect(dbTemplate).toBeDefined();
    });
  });

  describe('GET /templates/:id', () => {
    it('should retrieve a template by ID', async () => {
      const { body } = await request(app.getHttpServer()).get(`/templates/${template.id}`).expect(200);

      expect(body).toMatchObject({
        id: template.id,
        name: template.name,
        metadata: template.metadata,
      });
    });

    it('should return 404 for non-existent template', async () => {
      await request(app.getHttpServer()).get('/templates/99999').expect(404);
    });
  });

  describe('GET /templates', () => {
    it('should list all templates', async () => {
      // Create second template
      const secondTemplate = await useDbTemplate({}, em);

      const { body } = await request(app.getHttpServer()).get('/templates').expect(200);

      expect(body.total).toBe(2);
      expect(body.items).toHaveLength(2);
      body.items.sort((a, b) => a.id.localeCompare(b.id));
      const templates = [template, secondTemplate].sort((a, b) => a.id.localeCompare(b.id));
      expect(body.items[0]).toMatchObject({
        id: templates[0].id,
        name: templates[0].name,
      });
      expect(body.items[1]).toMatchObject({
        id: templates[1].id,
        name: templates[1].name,
      });
    });
  });

  describe('PUT /templates/:id', () => {
    it('should update a template', async () => {
      const updateDto: UpdateTemplateDto = {
        name: 'Updated REST Template',
        processCode: 'updated-process',
        metadata: { fields: ['updated'] },
        outputFormat: 'xml',
      };

      const { body } = await request(app.getHttpServer()).put(`/templates/${template.id}`).send(updateDto).expect(200);

      expect(body).toMatchObject(updateDto);

      // Verify database update
      em.clear();
      const updatedTemplate = await em.findOne(Template, { id: template.id });
      expect(updatedTemplate?.name).toBe(updateDto.name);
    });
  });

  describe('DELETE /templates/:id', () => {
    it('should delete a template', async () => {
      await request(app.getHttpServer()).delete(`/templates/${template.id}`).expect(204);

      // Verify deletion
      em.clear();
      const deletedTemplate = await em.findOne(Template, { id: template.id });
      expect(deletedTemplate).toBeNull();
    });
  });

  describe('Authorization', () => {
    it('should prevent non-admin users from accessing all templates', async () => {
      // Create regular user
      const regularUser = await useDbUser({ role: UserRole.CUSTOMER }, em);
      user = regularUser;

      await request(app.getHttpServer())
        .get('/templates')
        .expect(200)
        .then(({ body }) => {
          // Should only see their own templates (none in this case)
          expect(body.total).toBe(0);
        });
    });
  });
});
