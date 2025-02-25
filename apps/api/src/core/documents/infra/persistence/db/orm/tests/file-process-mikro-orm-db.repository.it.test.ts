import { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { FileProcessMikroOrmDbRepository } from '../file-process-mikro-orm-db.repository';
import { BaseIntegrationTestModule } from '@/infra/tests/base-integration-test.module';

import { FileToProcess, FileProcessStatus } from '@/core/documents/domain/entities/file-process.entity';
import { useDbFileProcess, useFileProcessFactory } from '@/core/documents/infra/tests/factories/file-process.factory';
import { BatchProcess } from '@/core/documents/domain/entities/batch-process.entity';
import { useDbBatchProcess } from '@/core/documents/infra/tests/factories/batch-process.factory';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { useDbUser } from '@/core/users/infra/tests/factories/users.factory';
import { useDbTemplate } from '@/core/templates/infra/tests/factories/templates.factory';
import { User } from '@/core/users/domain/entities/user.entity';

describe('FileProcessMikroOrmDbRepository (integration)', () => {
  let app: INestApplication;
  let orm: MikroORM;
  let em: EntityManager;
  let repository: FileProcessMikroOrmDbRepository;
  let testBatch: BatchProcess;
  let testFile: FileToProcess;
  let testTemplate: Template;
  let testUser: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BaseIntegrationTestModule],
      providers: [FileProcessMikroOrmDbRepository],
    }).compile();

    orm = module.get<MikroORM>(MikroORM);
    em = orm.em as EntityManager;
    repository = module.get<FileProcessMikroOrmDbRepository>(FileProcessMikroOrmDbRepository);
    app = module.createNestApplication();

    await app.init();

    // Create test data
    testUser = await useDbUser({}, em);
    testTemplate = await useDbTemplate({}, em);
    testBatch = await useDbBatchProcess({ user: testUser, template: testTemplate }, em);
    testFile = await useDbFileProcess(
      { batchProcess: testBatch, template: testTemplate, status: FileProcessStatus.FAILED, user: testUser },
      em,
    );

    await em.persistAndFlush([testBatch, testFile]);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByBatchPaginated', () => {
    it('should find files by batch with pagination', async () => {
      // Create additional test files
      const file2 = await useDbFileProcess(
        { batchProcess: testBatch, template: testTemplate, status: FileProcessStatus.FAILED, user: testUser },
        em,
      );
      const file3 = await useDbFileProcess(
        { batchProcess: testBatch, template: testTemplate, status: FileProcessStatus.FAILED, user: testUser },
        em,
      );
      await em.flush();

      const results = await repository.findByBatchPaginated(testBatch.id, 2, 1);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe(file2.id);
      expect(results[1].id).toBe(file3.id);
    });
  });

  describe('deleteByBatchId', () => {
    it('should delete all files for a batch', async () => {
      // Create another file in same batch
      await useDbFileProcess({ batchProcess: testBatch, template: testTemplate, user: testUser }, em);
      await em.flush();

      await repository.deleteByBatchId(testBatch.id);

      const remainingFiles = await em.find(FileToProcess, { batchProcess: testBatch });
      expect(remainingFiles).toHaveLength(0);
    });
  });

  describe('countByBatchAndStatus', () => {
    it('should count files by batch and status', async () => {
      // Create files with different statuses
      await useDbFileProcess(
        { batchProcess: testBatch, status: FileProcessStatus.COMPLETED, template: testTemplate, user: testUser },
        em,
      );
      await useDbFileProcess(
        { batchProcess: testBatch, status: FileProcessStatus.COMPLETED, template: testTemplate, user: testUser },
        em,
      );
      await useDbFileProcess(
        { batchProcess: testBatch, status: FileProcessStatus.PENDING, template: testTemplate, user: testUser },
        em,
      );
      await em.flush();

      const processedCount = await repository.countByBatchAndStatus(testBatch.id, FileProcessStatus.COMPLETED);
      const pendingCount = await repository.countByBatchAndStatus(testBatch.id, FileProcessStatus.PENDING);

      expect(processedCount).toBe(2);
      expect(pendingCount).toBe(1);
    });
  });

  describe('findCompletedByBatchStream', () => {
    it('should stream completed files in batches without loading all in memory', async () => {
      // Create a new batch with completed files
      const streamBatch = await useDbBatchProcess({ user: testUser, template: testTemplate }, em);
      const fileCount = 10000;

      // Create 10,000 completed files with unique results
      for (let i = 0; i < fileCount; i++) {
        useFileProcessFactory(
          {
            batchProcess: streamBatch,
            template: testTemplate,
            user: testUser,
            status: FileProcessStatus.COMPLETED,
            result: {
              data: `stream-data-${i}`,
              filename: `file-${i}.txt`,
              nested: { value: i },
            },
            createdAt: new Date(),
          },
          em,
        );
      }
      await em.flush();

      let processedCount = 0;

      const stream = repository.findCompletedByBatchStream(streamBatch.id, 1000);

      // Wrap stream processing in a promise
      await new Promise((resolve, reject) => {
        stream.on('data', (result) => {
          expect(result).toMatchObject({
            data: expect.any(String),
            filename: expect.any(String),
            nested: { value: expect.any(Number) },
          });

          processedCount++;
        });

        stream.on('end', resolve);
        stream.on('error', reject);
      });

      // Assertions
      expect(processedCount).toBe(fileCount);
    });
  });
});
