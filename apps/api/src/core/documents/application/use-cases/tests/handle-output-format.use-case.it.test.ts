import * as fs from 'fs/promises';
import * as path from 'path';
import { INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { BatchStatus } from '@/core/documents/domain/entities/batch-process.entity';
import { useDbBatchProcess } from '@/core/documents/infra/tests/factories/batch-process.factory';
import { useFileRecordFactory } from '@/core/documents/infra/tests/factories/file-process.factory';
import { User } from '@/core/users/domain/entities/user.entity';
import { useDbUser } from '@/core/users/infra/tests/factories/users.factory';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { useDbTemplate } from '@/core/templates/infra/tests/factories/templates.factory';
import { FileProcessStatus } from '@/core/documents/domain/entities/file-records.entity';
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
import { FileFormat } from '@/core/documents/domain/constants/file-formats';
import { DownloadPath } from '@/core/documents/domain/value-objects/download-path.vo';

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
    })
      .overrideProvider(ExcelPort)
      .useValue(new ExcelJsAdapter())
      .overrideProvider(CsvPort)
      .useValue(new Json2CsvAdapter())
      .overrideProvider(FileStoragePort)
      .useValue(new LocalFileStorageAdapter())
      .compile();

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

  const createTestBatch = async (fileCount: number, outputFormats: FileFormat[]) => {
    const batch = await useDbBatchProcess(
      {
        user: testUser,
        template: testTemplate,
        status: BatchStatus.PROCESSING,
        requestedFormats: outputFormats,
      },
      em,
    );

    for (let i = 0; i < fileCount; i++) {
      useFileRecordFactory(
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
    return batch;
  };

  describe('execute', () => {
    it('should generate JSON output', async () => {
      const batch = await createTestBatch(101, [FileFormat.JSON]);
      await useCase.execute(batch);
      const downloadPath = DownloadPath.forUser(batch.user.id, batch.id);

      const jsonPath = path.join(process.cwd(), '/test-files', downloadPath.forUserExtension(FileFormat.JSON));
      const jsonContent = await fs.readFile(jsonPath, 'utf-8');
      const jsonData = JSON.parse(jsonContent);

      expect(jsonData).toHaveLength(101);
      expect(batch.jsonResults).toBeDefined();
    });

    it('should generate CSV output', async () => {
      const batch = await createTestBatch(101, [FileFormat.CSV]);
      await useCase.execute(batch);
      const downloadPath = DownloadPath.forUser(batch.user.id, batch.id);

      const csvPath = path.join(process.cwd(), '/test-files', downloadPath.forUserExtension(FileFormat.CSV));
      const csvContent = await fs.readFile(csvPath, 'utf-8');

      expect(csvContent).toContain('test0');
      expect(csvContent).toContain('test1');
      expect(csvContent).toContain('test100');
      expect(batch.csvResults).toBeDefined();
    });

    it('should generate Excel output', async () => {
      const batch = await createTestBatch(101, [FileFormat.XLSX]);
      await useCase.execute(batch);
      const downloadPath = DownloadPath.forUser(batch.user.id, batch.id);

      const excelPath = path.join(process.cwd(), '/test-files', downloadPath.forUserExtension(FileFormat.XLSX));
      const fileExists = await fs
        .access(excelPath)
        .then(() => true)
        .catch(() => false);

      expect(fileExists).toBe(true);
      expect(batch.excelResults).toBeDefined();
    });

    it('should handle multiple output formats', async () => {
      const batch = await createTestBatch(101, [FileFormat.JSON, FileFormat.CSV, FileFormat.XLSX]);
      await useCase.execute(batch);
      expect(batch.jsonResults).toBeDefined();
      expect(batch.csvResults).toBeDefined();
      expect(batch.excelResults).toBeDefined();
    });
  });
});
