import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { BadRequestException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { PublicSyncFileProcessUseCase } from '../public-sync-file-process.use-case';
import { TemplateDbPort } from '@lib/templates/core/application/ports/templates-db.port';
import { FileStoragePort } from '@lib/file-storage/core/ports/file-storage.port';
import { UuidAdapter } from '@lib/uuid/core/uuid.adapter';
import { DocumentProcessResult } from 'apps/process-document-job/src/core/domain/value-objects/document-process-result';
import { ConfigService } from '@nestjs/config';
import { DocumentProcessorPort } from '../../ports/document-processor.port';
import { PublicFileProcessDbPort } from '../../ports/public-file-process-db.port';
import { useTemplateFactory } from '@lib/templates/core/infra/tests/factories/templates.factory';
import { FileFormat } from '@lib/documents/core/domain/constants/file-formats';
import { CsvPort } from '@lib/csv/core/ports/csv.port';
import { ExcelPort } from '@lib/excel/core/ports/excel.port';

describe('PublicSyncFileProcessUseCase', () => {
  let useCase: PublicSyncFileProcessUseCase;
  let templateRepository: jest.Mocked<TemplateDbPort>;
  let documentProcessor: jest.Mocked<DocumentProcessorPort>;
  let fileStorage: jest.Mocked<FileStoragePort>;
  let publicFileProcessRepo: jest.Mocked<PublicFileProcessDbPort>;
  let em: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        PublicSyncFileProcessUseCase,
        {
          provide: TemplateDbPort,
          useValue: createMock<TemplateDbPort>({
            findById: jest.fn().mockResolvedValue(null),
          }),
        },
        {
          provide: DocumentProcessorPort,
          useValue: createMock<DocumentProcessorPort>({
            process: jest.fn().mockResolvedValue(DocumentProcessResult.fromSuccess({})),
          }),
        },

        {
          provide: PublicFileProcessDbPort,
          useValue: createMock<PublicFileProcessDbPort>({
            create: jest.fn().mockImplementation((data) => ({
              ...data,
              markCompleted: jest.fn(),
              markFailed: jest.fn(),
              setResult: jest.fn(),
            })),
            save: jest.fn().mockResolvedValue(undefined),
          }),
        },
      ],
    })
      .overrideProvider(UuidAdapter)
      .useValue(
        createMock<UuidAdapter>({
          generate: jest.fn().mockReturnValue('mock-uuid'),
        }),
      )
      .overrideProvider(ConfigService)
      .useValue(
        createMock<ConfigService>({
          get: jest.fn().mockReturnValue('http://api.example.com'),
        }),
      )
      .overrideProvider(CsvPort)
      .useValue(
        createMock<CsvPort>({
          convertToCsv: jest.fn().mockReturnValue('csv,data'),
        }),
      )
      .overrideProvider(ExcelPort)
      .useValue(
        createMock<ExcelPort>({
          convertToExcel: jest.fn().mockResolvedValue(Buffer.from('excel-data')),
        }),
      )
      .compile();

    useCase = module.get<PublicSyncFileProcessUseCase>(PublicSyncFileProcessUseCase);
    templateRepository = module.get(TemplateDbPort);
    documentProcessor = module.get(DocumentProcessorPort);
    fileStorage = module.get(FileStoragePort);
    publicFileProcessRepo = module.get(PublicFileProcessDbPort);
    em = module.get(EntityManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockFile = (name: string) => ({
    fileName: name,
    data: Buffer.from('test'),
  });

  it('should throw when template not found', async () => {
    await expect(
      useCase.execute({
        templateId: 'invalid-template',
        files: [mockFile('test.txt')],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw when exceeding max files', async () => {
    const template = useTemplateFactory({}, em);
    templateRepository.findById.mockResolvedValue(template);

    const files = Array(6)
      .fill(null)
      .map((_, i) => mockFile(`file${i}.txt`));

    await expect(
      useCase.execute({
        templateId: template.id,
        files,
      }),
    ).rejects.toThrow('Up to 5 files are allowed');
  });

  it('should process files and return output formats', async () => {
    const template = useTemplateFactory({}, em);
    templateRepository.findById.mockResolvedValue(template);
    documentProcessor.process.mockResolvedValue(DocumentProcessResult.fromSuccess({ field: 'value' }));

    const result = await useCase.execute({
      templateId: template.id,
      files: [mockFile('test1.txt'), mockFile('test2.txt')],
      outputFormats: [FileFormat.JSON, FileFormat.CSV, FileFormat.XLSX],
    });

    expect(fileStorage.uploadFromBuffer).toHaveBeenCalledTimes(5); // 2 source files + 3 output formats
    expect(publicFileProcessRepo.save).toHaveBeenCalled();
    expect(result).toEqual({
      errors: [],
      json: expect.stringContaining('/downloads/results/mock-uuid/mock-uuid.json'),
      csv: expect.stringContaining('/downloads/results/mock-uuid/mock-uuid.csv'),
      excel: expect.stringContaining('/downloads/results/mock-uuid/mock-uuid.xlsx'),
    });
  });

  it('should handle processing errors', async () => {
    const template = useTemplateFactory({}, em);
    templateRepository.findById.mockResolvedValue(template);
    documentProcessor.process.mockRejectedValue(new Error('Processing failed'));

    await useCase.execute({
      templateId: template.id,
      files: [mockFile('error.txt')],
    });

    expect(publicFileProcessRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'error.txt',
        filePath: expect.any(String),
        template,
      }),
    );
  });

  it('should generate correct public URLs', async () => {
    const template = useTemplateFactory({}, em);
    templateRepository.findById.mockResolvedValue(template);

    const result = await useCase.execute({
      templateId: template.id,
      files: [mockFile('test.txt')],
      outputFormats: [FileFormat.JSON],
    });

    expect(result.json).toMatch('http://api.example.com/api/v1/downloads/results/mock-uuid/mock-uuid.json');
  });
});
