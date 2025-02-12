import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { ProcessFileUseCase } from '../process-file.use-case';
import { FileProcessDbPort } from '../../ports/file-process-db.port';
import { DocumentProcessorPort } from '../../ports/document-processor.port';
import { WebhookNotifierPort } from '../../ports/webhook-notifier.port';
import { useFileProcessFactory } from '@/core/documents/infra/tests/factories/file-process.factory';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { useTemplateFactory } from '@/core/templates/infra/tests/factories/templates.factory';
import { FileProcessStatus } from '@/core/documents/domain/entities/file-process.entity';
import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { Readable } from 'stream';
import { BatchDbPort } from '../../ports/batch-db.port';
import { useBatchProcessFactory } from '@/core/documents/infra/tests/factories/batch-process.factory';

describe('ProcessFileUseCase', () => {
  let useCase: ProcessFileUseCase;
  let fileProcessDbPort: jest.Mocked<FileProcessDbPort>;
  let documentProcessor: jest.Mocked<DocumentProcessorPort>;
  let webhookNotifier: jest.Mocked<WebhookNotifierPort>;
  let fileStoragePort: jest.Mocked<FileStoragePort>;
  let batchDbPort: jest.Mocked<BatchDbPort>;
  let em: EntityManager;
  let mockUser: ReturnType<typeof useUserFactory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        ProcessFileUseCase,
        {
          provide: FileProcessDbPort,
          useValue: createMock<FileProcessDbPort>({
            save: jest.fn().mockResolvedValue(undefined),
          }),
        },
        {
          provide: DocumentProcessorPort,
          useValue: createMock<DocumentProcessorPort>({
            process: jest.fn().mockResolvedValue({ isSuccess: () => true, payload: {} }),
          }),
        },
        {
          provide: WebhookNotifierPort,
          useValue: createMock<WebhookNotifierPort>(),
        },
        {
          provide: FileStoragePort,
          useValue: createMock<FileStoragePort>({
            get: jest.fn().mockResolvedValue(
              new Readable({
                read() {
                  this.push('test');
                  this.push(null);
                },
              }),
            ),
          }),
        },
        {
          provide: BatchDbPort,
          useValue: createMock<BatchDbPort>({}),
        },
      ],
    }).compile();

    useCase = module.get<ProcessFileUseCase>(ProcessFileUseCase);
    fileProcessDbPort = module.get(FileProcessDbPort);
    documentProcessor = module.get(DocumentProcessorPort);
    webhookNotifier = module.get(WebhookNotifierPort);
    batchDbPort = module.get(BatchDbPort);
    fileStoragePort = module.get(FileStoragePort);
    em = module.get(EntityManager);
    mockUser = useUserFactory({}, em);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should process file successfully with webhook', async () => {
    const template = useTemplateFactory({ user: mockUser }, em);
    const fileProcess = useFileProcessFactory(
      {
        status: FileProcessStatus.PENDING,
        template,
        filePath: 's3://valid/path.pdf',
      },
      em,
    );

    const result = await useCase.execute({
      user: mockUser,
      file: fileProcess,
    });

    expect(documentProcessor.process).toHaveBeenCalledWith(expect.any(Buffer), template);
    expect(fileStoragePort.get).toHaveBeenCalledWith(fileProcess.filePath);
    expect(webhookNotifier.notifySuccess).toHaveBeenCalled();
    expect(result.status).toBe(FileProcessStatus.COMPLETED);
    expect(fileProcessDbPort.save).toHaveBeenCalledTimes(2);
  });

  it('should handle processing failure', async () => {
    const template = useTemplateFactory({ user: mockUser }, em);
    const fileProcess = useFileProcessFactory({ template }, em);
    documentProcessor.process.mockResolvedValueOnce(
      createMock<DocumentProcessResult>({
        isError: () => true,
        errorMessage: 'Invalid format',
        isSuccess: () => false,
      }),
    );

    const result = await useCase.execute({ user: mockUser, file: fileProcess });

    expect(result.status).toBe(FileProcessStatus.FAILED);
    expect(webhookNotifier.notifyFailure).toHaveBeenCalled();
  });

  it('should reject inaccessible template', async () => {
    const otherUserTemplate = useTemplateFactory({ user: useUserFactory({}, em), isPublic: false }, em);
    const otherFileProcess = useFileProcessFactory({ template: otherUserTemplate }, em);

    await expect(useCase.execute({ user: mockUser, file: otherFileProcess })).rejects.toThrow(
      "You don't have access to this template",
    );
  });

  it('should handle missing file path', async () => {
    const fileProcess = useFileProcessFactory(
      { filePath: null, template: useTemplateFactory({ user: mockUser }, em) },
      em,
    );

    await expect(useCase.execute({ user: mockUser, file: fileProcess })).rejects.toThrow(
      'Missing file for file processing',
    );
  });

  it('should throw when template is not found', async () => {
    const fileProcess = useFileProcessFactory(
      {
        template: useTemplateFactory({ user: mockUser }, em),
      },
      em,
    );

    jest.spyOn(fileProcess.template, 'load').mockResolvedValueOnce(null);

    await expect(useCase.execute({ user: mockUser, file: fileProcess })).rejects.toThrow('Template not found');
  });

  it('should throw when file size exceeds maximum limit', async () => {
    const template = useTemplateFactory({ user: mockUser }, em);
    const fileProcess = useFileProcessFactory(
      {
        status: FileProcessStatus.PENDING,
        template,
        filePath: 's3://valid/large-file.pdf',
      },
      em,
    );

    // Mock a large file (400KB)
    fileStoragePort.get.mockResolvedValueOnce(
      new Readable({
        read() {
          this.push(Buffer.alloc(400 * 1024));
          this.push(null);
        },
      }),
    );

    await expect(useCase.execute({ user: mockUser, file: fileProcess })).rejects.toThrow(
      'File ' + fileProcess.id + ' is too large (max 300KB)',
    );
  });

  it('should handle batch completion when all files are processed', async () => {
    const template = useTemplateFactory({ user: mockUser }, em);
    const batchProcess = useBatchProcessFactory({ user: mockUser, template }, em);
    const fileProcess = useFileProcessFactory(
      {
        status: FileProcessStatus.PENDING,
        template,
        filePath: 's3://valid/path.pdf',
        batchProcess,
      },
      em,
    );

    em.clear();
    const updatedBatchProcess = useBatchProcessFactory(
      {
        ...batchProcess,
        processedFiles: batchProcess.totalFiles,
      },
      em,
    );
    // Mock batch increment to return updated count
    (batchDbPort.incrementProcessedFilesCount as jest.Mock).mockResolvedValueOnce(updatedBatchProcess);

    const spy = jest.spyOn(updatedBatchProcess, 'markCompleted');

    await useCase.execute({ user: mockUser, file: fileProcess });

    expect(batchDbPort.incrementProcessedFilesCount).toHaveBeenCalledWith(batchProcess.id);
    expect(spy).toHaveBeenCalled();
    expect(webhookNotifier.notifyBatchCompleted).toHaveBeenCalledWith(
      expect.objectContaining({
        id: batchProcess.id,
        totalFiles: batchProcess.totalFiles,
        processedFiles: batchProcess.totalFiles,
      }),
    );
  });
});
