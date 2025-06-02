import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@dev-modules/dev-modules/tests/base-unit-test.module';
import { ProcessFileUseCase } from '../../../../../../../workflows/src/core/application/use-cases/process-file.use-case';
import { FileProcessDbPort } from '../../ports/file-process-db.port';
import { DocumentProcessorPort } from '../../ports/document-processor.port';
import { WebhookNotifierPort } from '../../ports/webhook-notifier.port';
import { useFileRecordFactory } from '@lib/documents/core/infra/tests/factories/file-process.factory';
import { useUserFactory } from '@lib/users/core/infra/tests/factories/users.factory';
import { useTemplateFactory } from '@lib/templates/core/infra/tests/factories/templates.factory';
import { FileProcessStatus } from '@lib/documents/core/domain/entities/file-records.entity';
import { DocumentProcessResult } from 'apps/process-document-job/src/core/domain/value-objects/document-process-result';
import { FileStoragePort } from '@lib/file-storage/core/ports/file-storage.port';
import { Readable } from 'stream';
import { BatchDbPort } from '../../ports/batch-db.port';
import { useBatchProcessFactory } from '@lib/documents/core/infra/tests/factories/batch-process.factory';
import { HandleOutputFormatUseCase } from '../handle-output-format.use-case';
import { UuidAdapter } from '@lib/uuid/core/uuid.adapter';

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
          provide: BatchDbPort,
          useValue: createMock<BatchDbPort>(),
        },
        {
          provide: HandleOutputFormatUseCase,
          useValue: createMock<HandleOutputFormatUseCase>(),
        },
      ],
    })
      .overrideProvider(FileStoragePort)
      .useValue(
        createMock<FileStoragePort>({
          get: jest.fn().mockResolvedValue(
            new Readable({
              read() {
                this.push('test');
                this.push(null);
              },
            }),
          ),
        }),
      )
      .overrideProvider(UuidAdapter)
      .useValue(createMock<UuidAdapter>({ generate: jest.fn().mockReturnValue('file-uuid') }))
      .compile();

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
    const fileProcess = useFileRecordFactory(
      {
        status: FileProcessStatus.PENDING,
        template,
        filePath: 's3://valid/path.pdf',
        user: mockUser,
      },
      em,
    );
    fileProcessDbPort.findById.mockResolvedValueOnce(fileProcess);
    fileStoragePort.getBuffer.mockResolvedValueOnce(Buffer.from('test'));

    const result = await useCase.execute({
      fileId: fileProcess.id,
    });

    expect(documentProcessor.process).toHaveBeenCalledWith(expect.any(Buffer), template);
    expect(fileStoragePort.getBuffer).toHaveBeenCalledWith(fileProcess.filePath);
    expect(webhookNotifier.notifySuccess).toHaveBeenCalled();
    expect(result.status).toBe(FileProcessStatus.COMPLETED);
    expect(fileProcessDbPort.save).toHaveBeenCalledTimes(2);
  });

  it('should handle processing failure', async () => {
    const template = useTemplateFactory({ user: mockUser }, em);
    const fileProcess = useFileRecordFactory({ template, user: mockUser }, em);
    documentProcessor.process.mockResolvedValueOnce(
      createMock<DocumentProcessResult>({
        isError: () => true,
        errorMessage: 'Invalid format',
        isSuccess: () => false,
      }),
    );
    fileProcessDbPort.findById.mockResolvedValueOnce(fileProcess);

    const result = await useCase.execute({ fileId: fileProcess.id });

    expect(result.status).toBe(FileProcessStatus.FAILED);
    expect(webhookNotifier.notifyFailure).toHaveBeenCalled();
  });

  it('should reject inaccessible template', async () => {
    const otherUserTemplate = useTemplateFactory({ user: useUserFactory({}, em), isPublic: false }, em);
    const otherFileProcess = useFileRecordFactory({ template: otherUserTemplate, user: mockUser }, em);
    fileProcessDbPort.findById.mockResolvedValueOnce(otherFileProcess);

    await expect(useCase.execute({ fileId: otherFileProcess.id })).rejects.toThrow(
      "You don't have access to this template",
    );
  });

  it('should handle missing file path', async () => {
    const fileProcess = useFileRecordFactory(
      { filePath: null, template: useTemplateFactory({ user: mockUser }, em), user: mockUser },
      em,
    );
    fileProcessDbPort.findById.mockResolvedValueOnce(fileProcess);

    await expect(useCase.execute({ fileId: fileProcess.id })).rejects.toThrow('Missing file for file processing');
  });

  it('should throw when template is not found', async () => {
    const fileProcess = useFileRecordFactory(
      {
        template: useTemplateFactory({ user: mockUser }, em),
        user: mockUser,
      },
      em,
    );
    fileProcessDbPort.findById.mockResolvedValueOnce(fileProcess);

    jest.spyOn(fileProcess.template, 'load').mockResolvedValueOnce(null);

    await expect(useCase.execute({ fileId: fileProcess.id })).rejects.toThrow('Template not found');
  });

  it('should handle batch completion when all files are processed', async () => {
    const template = useTemplateFactory({ user: mockUser }, em);
    const batchProcess = useBatchProcessFactory({ user: mockUser, template }, em);
    const fileProcess = useFileRecordFactory(
      {
        status: FileProcessStatus.PENDING,
        template,
        filePath: 's3://valid/path.pdf',
        batchProcess,
        user: mockUser,
      },
      em,
    );
    fileProcessDbPort.findById.mockResolvedValueOnce(fileProcess);

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

    await useCase.execute({ fileId: fileProcess.id });

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
