import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { SyncBatchProcessUseCase } from '../sync-batch-process.use-case';
import { BatchDbPort } from '../../ports/batch-db.port';
import { FileProcessDbPort } from '../../ports/file-process-db.port';
import { ProcessFileUseCase } from '../process-file.use-case';
import { CreateBatchProcessUseCase } from '../create-batch-process.use-case';
import { CancelBatchProcessUseCase } from '../cancel-batch-process.use-case';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { useBatchProcessFactory } from '@/core/documents/infra/tests/factories/batch-process.factory';
import { BatchStatus } from '@/core/documents/domain/entities/batch-process.entity';
import { FileProcessStatus } from '@/core/documents/domain/entities/file-process.entity';
import { useFileProcessFactory } from '@/core/documents/infra/tests/factories/file-process.factory';
describe('SyncBatchProcessUseCase', () => {
  let useCase: SyncBatchProcessUseCase;
  let batchDbPort: jest.Mocked<BatchDbPort>;
  let fileProcessDbPort: jest.Mocked<FileProcessDbPort>;
  let processFileUseCase: jest.Mocked<ProcessFileUseCase>;
  let createBatchProcessUseCase: jest.Mocked<CreateBatchProcessUseCase>;
  let em: EntityManager;
  let mockUser: ReturnType<typeof useUserFactory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        SyncBatchProcessUseCase,
        {
          provide: BatchDbPort,
          useValue: createMock<BatchDbPort>({
            save: jest.fn().mockResolvedValue(undefined),
          }),
        },
        {
          provide: FileProcessDbPort,
          useValue: createMock<FileProcessDbPort>({
            findByBatchPaginated: jest.fn().mockResolvedValue([]),
            countByBatchAndStatus: jest.fn().mockResolvedValue(0),
          }),
        },
        {
          provide: ProcessFileUseCase,
          useValue: createMock<ProcessFileUseCase>({
            execute: jest.fn().mockResolvedValue({}),
          }),
        },
        {
          provide: CreateBatchProcessUseCase,
          useValue: createMock<CreateBatchProcessUseCase>({}),
        },
        {
          provide: CancelBatchProcessUseCase,
          useValue: createMock<CancelBatchProcessUseCase>({
            execute: jest.fn().mockResolvedValue(undefined),
          }),
        },
      ],
    }).compile();

    useCase = module.get<SyncBatchProcessUseCase>(SyncBatchProcessUseCase);
    batchDbPort = module.get(BatchDbPort);
    fileProcessDbPort = module.get(FileProcessDbPort);
    processFileUseCase = module.get(ProcessFileUseCase);
    createBatchProcessUseCase = module.get(CreateBatchProcessUseCase);
    em = module.get(EntityManager);
    mockUser = useUserFactory({}, em);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should process batch with files successfully', async () => {
    const batch = useBatchProcessFactory({ status: BatchStatus.CREATED, totalFiles: 2, processedFiles: 0 }, em);
    const files = [
      useFileProcessFactory({ status: FileProcessStatus.PENDING }, em),
      useFileProcessFactory({ status: FileProcessStatus.PENDING }, em),
    ];

    createBatchProcessUseCase.execute.mockResolvedValue(batch);
    fileProcessDbPort.findByBatchPaginated.mockResolvedValue(files);

    await useCase.execute(mockUser, { templateId: 'template-123' });

    expect(processFileUseCase.execute).toHaveBeenCalledTimes(2);
    expect(batchDbPort.update).toHaveBeenCalledWith(
      batch.id,
      expect.objectContaining({
        status: BatchStatus.COMPLETED,
      }),
    );
  });

  it('should cancel batch if too many files', async () => {
    const batch = useBatchProcessFactory({ totalFiles: 11 }, em);
    createBatchProcessUseCase.execute.mockResolvedValue(batch);

    await expect(useCase.execute(mockUser, { templateId: 'template-123' })).rejects.toThrow(
      'Up to 10 files are allowed',
    );

    expect(batchDbPort.update).not.toHaveBeenCalled();
  });

  it('should handle partial failures', async () => {
    const batch = useBatchProcessFactory({ status: BatchStatus.CREATED }, em);
    const files = [
      useFileProcessFactory({ status: FileProcessStatus.PENDING }, em),
      useFileProcessFactory({ status: FileProcessStatus.PENDING }, em),
    ];

    createBatchProcessUseCase.execute.mockResolvedValue(batch);
    fileProcessDbPort.findByBatchPaginated.mockResolvedValue(files);
    fileProcessDbPort.countByBatchAndStatus.mockResolvedValue(1);
    processFileUseCase.execute.mockRejectedValueOnce(new Error('Processing failed'));

    await useCase.execute(mockUser, { templateId: 'template-123' });

    expect(batchDbPort.update).toHaveBeenCalledWith(batch.id, { status: BatchStatus.PARTIALLY_COMPLETED });
  });

  it('should throw if batch already started', async () => {
    const batch = useBatchProcessFactory({ status: BatchStatus.PROCESSING }, em);
    createBatchProcessUseCase.execute.mockResolvedValue(batch);

    await expect(useCase.execute(mockUser, { templateId: 'template-123' })).rejects.toThrow(
      'Batch has already been started',
    );
  });
});
