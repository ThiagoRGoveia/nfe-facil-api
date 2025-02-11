import { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { BatchMikroOrmRepository } from '../batch-process-mikro-orm-db.repository';
import { BaseIntegrationTestModule } from '@/infra/tests/base-integration-test.module';

import { BatchProcess, BatchStatus } from '@/core/documents/domain/entities/batch-process.entity';
import { useDbBatchProcess } from '@/core/documents/infra/tests/factories/batch-process.factory';
import { FileToProcess } from '@/core/documents/domain/entities/file-process.entity';
import { useDbFileProcess } from '@/core/documents/infra/tests/factories/file-process.factory';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { useDbUser } from '@/core/users/infra/tests/factories/users.factory';
import { useDbTemplate } from '@/core/templates/infra/tests/factories/templates.factory';
import { User } from '@/core/users/domain/entities/user.entity';

describe('BatchMikroOrmRepository (integration)', () => {
  let app: INestApplication;
  let orm: MikroORM;
  let em: EntityManager;
  let repository: BatchMikroOrmRepository;
  let testBatch: BatchProcess;
  let testFile: FileToProcess;
  let testTemplate: Template;
  let testUser: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BaseIntegrationTestModule],
      providers: [BatchMikroOrmRepository],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    em = orm.em as EntityManager;
    repository = module.get<BatchMikroOrmRepository>(BatchMikroOrmRepository);
    app = module.createNestApplication();

    await app.init();

    // Create test data
    testUser = await useDbUser({}, em);
    testTemplate = await useDbTemplate({}, em);
    testBatch = await useDbBatchProcess({ user: testUser, template: testTemplate }, em);
    testFile = await useDbFileProcess({ batchProcess: testBatch, template: testTemplate }, em);
    testBatch.files.add(testFile);

    await em.persistAndFlush([testBatch, testFile]);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new batch process', async () => {
      const persistedBatch = repository.create({
        status: BatchStatus.CREATED,
        template: testTemplate,
        user: testUser,
        files: [testFile],
        processedFiles: 1,
        totalFiles: 1,
      });
      await em.persistAndFlush(persistedBatch);

      const foundBatch = await em.findOne(BatchProcess, { id: persistedBatch.id });
      expect(foundBatch).toBeDefined();
      expect(foundBatch?.id).toBe(persistedBatch.id);
      expect(foundBatch?.files.length).toBe(1);
      expect(foundBatch?.files[0].id).toBe(testFile.id);
      expect(foundBatch?.processedFiles).toBe(1);
      expect(foundBatch?.totalFiles).toBe(1);
      expect(foundBatch?.status).toBe(BatchStatus.CREATED);
      expect(foundBatch?.template).toBe(testBatch.template);
      expect(foundBatch?.user).toBe(testBatch.user);
    });
  });

  describe('findById', () => {
    it('should find a batch process by id', async () => {
      const foundBatch = await repository.findById(testBatch.id);
      expect(foundBatch).toBeDefined();
      expect(foundBatch?.id).toBe(testBatch.id);
    });
  });

  describe('update', () => {
    it('should update a batch process', async () => {
      const updatedBatch = repository.update(testBatch.id, { processedFiles: 2 });
      await em.persistAndFlush(updatedBatch);

      em.clear();
      const foundBatch = await em.findOne(BatchProcess, { id: testBatch.id });
      expect(foundBatch).toBeDefined();
      expect(foundBatch?.processedFiles).toBe(2);
    });
  });

  describe('incrementProcessedFilesCount', () => {
    it('should increment processed files count', async () => {
      const initialCount = testBatch.processedFiles;

      const response = await repository.incrementProcessedFilesCount(testBatch.id);

      em.clear();
      const updatedBatch = await em.findOne(BatchProcess, { id: testBatch.id });
      expect(updatedBatch?.processedFiles).toBe(initialCount + 1);
      expect(response.processedFiles).toBe(updatedBatch?.processedFiles);
    });
  });
});
