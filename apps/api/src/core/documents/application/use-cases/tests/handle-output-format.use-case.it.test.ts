import * as fs from 'fs/promises';
import * as path from 'path';
import { INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { BatchProcess, BatchStatus } from '@/core/documents/domain/entities/batch-process.entity';
import { useDbBatchProcess } from '@/core/documents/infra/tests/factories/batch-process.factory';
import { useFileProcessFactory } from '@/core/documents/infra/tests/factories/file-process.factory';
import { User } from '@/core/users/domain/entities/user.entity';
import { useDbUser } from '@/core/users/infra/tests/factories/users.factory';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { useDbTemplate } from '@/core/templates/infra/tests/factories/templates.factory';
import { FileProcessStatus } from '@/core/documents/domain/entities/file-process.entity';
import { HandleOutputFormatUseCase } from '../handle-output-format.use-case';
import { LocalFileStorageAdapter } from '@/infra/aws/s3/adapters/local-file-storage.adapter';
import { CsvPort } from '@/infra/json-to-csv/ports/csv.port';
import { ExcelPort } from '@/infra/excel/ports/excel.port';
import { BatchDbPort } from '@/core/documents/application/ports/batch-db.port';
import { FileProcessDbPort } from '@/core/documents/application/ports/file-process-db.port';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { Json2CsvAdapter } from '@/infra/json-to-csv/adapters/json-2-csv.adapter';
import { ExcelJsAdapter } from '@/infra/excel/adapters/excel.adapter';
import { FileProcessMikroOrmDbRepository } from '@/core/documents/infra/persistence/db/orm/file-process-mikro-orm-db.repository';
import { BaseIntegrationTestModule } from '@/infra/tests/base-integration-test.module';

jest.setTimeout(100000000);
describe('HandleOutputFormatUseCase (Integration)', () => {
  let app: INestApplication;
  let em: EntityManager;
  let useCase: HandleOutputFormatUseCase;
  let testUser: User;
  let testTemplate: Template;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BaseIntegrationTestModule],
      providers: [
        HandleOutputFormatUseCase,
        {
          provide: FileStoragePort,
          useClass: LocalFileStorageAdapter,
        },
        {
          provide: CsvPort,
          useClass: Json2CsvAdapter,
        },
        {
          provide: ExcelPort,
          useClass: ExcelJsAdapter,
        },
        {
          provide: BatchDbPort,
          useValue: {
            save: jest.fn().mockImplementation(async (batch) => {
              await em.persistAndFlush(batch);
            }),
          },
        },
        {
          provide: FileProcessDbPort,
          useClass: FileProcessMikroOrmDbRepository,
        },
      ],
    }).compile();

    em = module.get<EntityManager>(EntityManager);
    app = module.createNestApplication();
    useCase = module.get<HandleOutputFormatUseCase>(HandleOutputFormatUseCase);

    await app.init();

    testUser = await useDbUser({}, em);
    testTemplate = await useDbTemplate({}, em);
  });

  afterEach(async () => {
    await app.close();
  });

  const createTestBatch = async (fileCount: number) => {
    const batch = await useDbBatchProcess(
      {
        user: testUser,
        template: testTemplate,
        status: BatchStatus.PROCESSING,
      },
      em,
    );

    for (let i = 0; i < fileCount; i++) {
      useFileProcessFactory(
        {
          batchProcess: batch,
          template: testTemplate,
          user: testUser,
          status: FileProcessStatus.COMPLETED,
          result: {
            data: `test${i}`,
            filename: `test${i}.json`,
            mimetype: 'application/json',
            nested: { data: `nested test${i}` },
            array: [`array test${i}`, `array test${i + 1}`],
            date: new Date(),
            boolean: true,
            null: null,
          },
        },
        em,
      );
    }

    await em.flush();
    em.clear();
    console.log('FINISHED CREATING BATCH');
    return batch;
  };

  describe('execute', () => {
    it('should generate JSON output', async () => {
      const batch = await createTestBatch(101);
      await useCase.execute(batch, ['json']);

      const jsonPath = path.join(process.cwd(), '/test-files', `${testUser.id}/batch-results/${batch.id}.json`);
      const jsonContent = await fs.readFile(jsonPath, 'utf-8');
      const jsonData = JSON.parse(jsonContent);

      expect(jsonData).toHaveLength(101);
      expect(jsonData[0].data).toBe('test0');
      expect(batch.jsonResults).toBeDefined();
    });

    it('should generate CSV output', async () => {
      const batch = await createTestBatch(101);
      await useCase.execute(batch, ['csv']);

      const csvPath = path.join(process.cwd(), '/test-files', `${testUser.id}/batch-results/${batch.id}.csv`);
      const csvContent = await fs.readFile(csvPath, 'utf-8');

      expect(csvContent).toContain('test0');
      expect(csvContent).toContain('test1');
      expect(csvContent).toContain('test100');
      expect(batch.csvResults).toBeDefined();
    });

    it('should generate Excel output', async () => {
      const batch = await createTestBatch(101);
      await useCase.execute(batch, ['excel']);

      const excelPath = path.join(process.cwd(), '/test-files', `${testUser.id}/batch-results/${batch.id}.xlsx`);
      const fileExists = await fs
        .access(excelPath)
        .then(() => true)
        .catch(() => false);

      expect(fileExists).toBe(true);
      expect(batch.excelResults).toBeDefined();
    });

    it('should handle multiple output formats', async () => {
      // const batch = await createTestBatch(50000);
      const batch = await em.findOneOrFail(BatchProcess, { id: 'fcefb75e-cb85-43aa-b93d-8df13d6d3e25' });
      await useCase.execute(batch, ['json', 'csv', 'excel']);

      expect(batch.jsonResults).toBeDefined();
      expect(batch.csvResults).toBeDefined();
      expect(batch.excelResults).toBeDefined();
    });
  });
});
