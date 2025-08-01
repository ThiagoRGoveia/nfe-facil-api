import fs from 'fs/promises';
import path from 'path';
import { INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { BatchStatus } from '@lib/documents/core/domain/entities/batch-process.entity';
import { useDbBatchProcess } from '@lib/documents/core/infra/tests/factories/batch-process.factory';
import { useFileRecordFactory } from '@lib/documents/core/infra/tests/factories/file-process.factory';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { useDbUser } from '@lib/users/core/infra/tests/factories/users.factory';
import { Template } from '@lib/templates/core/domain/entities/template.entity';
import { useDbTemplate } from '@lib/templates/core/infra/tests/factories/templates.factory';
import { FileProcessStatus } from '@lib/documents/core/domain/entities/file-records.entity';
import { HandleOutputFormatUseCase } from '../handle-output-format.use-case';
import { CsvPort } from '@lib/csv/core/ports/csv.port';
import { ExcelPort } from '@lib/excel/core/ports/excel.port';
import { BatchDbPort } from '@lib/documents/core/application/ports/batch-db.port';
import { FileStoragePort } from '@lib/file-storage/core/ports/file-storage.port';
import { BaseIntegrationTestModule } from '@dev-modules/dev-modules/tests/base-integration-test.module';
import { FileFormat } from '@lib/documents/core/domain/constants/file-formats';
import { LocalFileStorageAdapter } from '@lib/file-storage/core/adapters/local-file-storage.adapter';
import { DownloadPath } from '@lib/documents/core/domain/value-objects/download-path.vo';
import { FileProcessDbPort } from '../../ports/file-process-db.port';
import { ExcelJsAdapter } from '@lib/excel/core/adapters/excel.adapter';
import { Json2CsvAdapter } from '@lib/csv/core/adapters/json-2-csv.adapter';
import { FileProcessMikroOrmDbRepository } from '@lib/documents/core/infra/persistence/db/orm/file-process-mikro-orm-db.repository';

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
