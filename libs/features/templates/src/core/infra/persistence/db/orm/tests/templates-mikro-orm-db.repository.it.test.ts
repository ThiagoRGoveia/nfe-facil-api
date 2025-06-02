import { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { TemplateMikroOrmDbRepository } from '../templates-mikro-orm-db.repository';
import { BaseIntegrationTestModule } from '@/infra/tests/base-integration-test.module';

import { Template } from '@lib/templates/core/domain/entities/template.entity';
import { useDbTemplate } from '@lib/templates/core/infra/tests/factories/templates.factory';
import { useDbUser } from '@lib/users/core/infra/tests/factories/users.factory';
import { UpdateTemplateDto } from '@lib/templates/core/application/dtos/update-template.dto';
import { User } from '@lib/users/core/domain/entities/user.entity';

describe('TemplateMikroOrmDbRepository (integration)', () => {
  let app: INestApplication;
  let orm: MikroORM;
  let em: EntityManager;
  let repository: TemplateMikroOrmDbRepository;
  let testTemplate: Template;
  let testUser: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BaseIntegrationTestModule],
      providers: [TemplateMikroOrmDbRepository],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    em = orm.em as EntityManager;
    repository = module.get<TemplateMikroOrmDbRepository>(TemplateMikroOrmDbRepository);
    app = module.createNestApplication();

    await app.init();

    testUser = await useDbUser({ id: '1' }, em);

    testTemplate = await useDbTemplate(
      {
        name: 'Test Template',
        processCode: 'test-process',
        outputFormat: 'json',
        user: testUser,
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

  describe('create', () => {
    it('should create a new template', async () => {
      const templateData = {
        name: 'New Template',
        processCode: 'new-process',
        outputFormat: 'xml',
        metadata: { fields: ['test'] },
        isPublic: false,
        user: testUser,
      };

      const template = repository.create(templateData);
      await em.persistAndFlush(template);

      expect(template.id).toBeDefined();
      expect(template.name).toBe(templateData.name);
      expect(template.processCode).toBe(templateData.processCode);
      expect(template.outputFormat).toBe(templateData.outputFormat);
      expect(template.user?.unwrap()).toBe(testUser);
    });
  });

  describe('update', () => {
    it('should update an existing template', async () => {
      const updateData: UpdateTemplateDto = {
        name: 'Updated Template',
        metadata: { fields: ['updated'] },
      };

      const updatedTemplate = repository.update(testTemplate.id, updateData);
      await em.persistAndFlush(updatedTemplate);

      expect(updatedTemplate.id).toBe(testTemplate.id);
      expect(updatedTemplate.name).toBe(updateData.name);
      expect(updatedTemplate.metadata).toEqual(updateData.metadata);
      expect(updatedTemplate.processCode).toBe(testTemplate.processCode);
      expect(updatedTemplate.user?.unwrap()).toBe(testUser);
    });
  });

  describe('findById', () => {
    it('should find template by id', async () => {
      const foundTemplate = await repository.findById(testTemplate.id);
      expect(foundTemplate).toBeDefined();
      expect(foundTemplate?.id).toBe(testTemplate.id);
      expect(foundTemplate?.name).toBe(testTemplate.name);
    });

    it('should return null for non-existent id', async () => {
      const foundTemplate = await repository.findById('999');
      expect(foundTemplate).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a template', async () => {
      await repository.delete(testTemplate.id);
      const deletedTemplate = await em.findOne(Template, { id: testTemplate.id });
      expect(deletedTemplate).toBeNull();
    });
  });
});
