import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { SyncFileProcessUseCase } from '../../../../../../../workflows/src/core/application/use-cases/sync-file-process.use-case';
import { BatchDbPort } from '../../ports/batch-db.port';
import { FileProcessDbPort } from '../../ports/file-process-db.port';
import { ProcessFileUseCase } from '../../../../../../../workflows/src/core/application/use-cases/process-file.use-case';
import { CreateBatchProcessUseCase } from '../create-batch-process.use-case';
import { CancelBatchProcessUseCase } from '../cancel-batch-process.use-case';
import { useUserFactory } from '@lib/users/core/infra/tests/factories/users.factory';
import { useBatchProcessFactory } from '@lib/documents/core/infra/tests/factories/batch-process.factory';
import { BatchStatus } from '@lib/documents/core/domain/entities/batch-process.entity';
import { FileProcessStatus } from '@lib/documents/core/domain/entities/file-records.entity';
import { useFileRecordFactory } from '@lib/documents/core/infra/tests/factories/file-process.factory';
describe('SyncBatchProcessUseCase', () => {
  let useCase: SyncFileProcessUseCase;
  let batchDbPort: jest.Mocked<BatchDbPort>;
  let fileProcessDbPort: jest.Mocked<FileProcessDbPort>;
  let processFileUseCase: jest.Mocked<ProcessFileUseCase>;
  let createBatchProcessUseCase: jest.Mocked<CreateBatchProcessUseCase>;
  let cancelBatchProcessUseCase: jest.Mocked<CancelBatchProcessUseCase>;
  let em: EntityManager;
  let mockUser: ReturnType<typeof useUserFactory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        SyncFileProcessUseCase,
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

    useCase = module.get<SyncFileProcessUseCase>(SyncFileProcessUseCase);
    batchDbPort = module.get(BatchDbPort);
    fileProcessDbPort = module.get(FileProcessDbPort);
    processFileUseCase = module.get(ProcessFileUseCase);
    createBatchProcessUseCase = module.get(CreateBatchProcessUseCase);
    cancelBatchProcessUseCase = module.get(CancelBatchProcessUseCase);
    em = module.get(EntityManager);
    mockUser = useUserFactory({}, em);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should process batch with files successfully', async () => {
    const batch = useBatchProcessFactory({ status: BatchStatus.CREATED, totalFiles: 2, processedFiles: 0 }, em);
    const files = [
      useFileRecordFactory({ status: FileProcessStatus.PENDING }, em),
      useFileRecordFactory({ status: FileProcessStatus.PENDING }, em),
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
    expect(batchDbPort.refresh).toHaveBeenCalledWith(batch);
  });

  it('should cancel batch if too many files', async () => {
    const batch = useBatchProcessFactory({ totalFiles: 11 }, em);
    createBatchProcessUseCase.execute.mockResolvedValue(batch);

    await expect(useCase.execute(mockUser, { templateId: 'template-123' })).rejects.toThrow(
      'Up to 10 files are allowed',
    );

    expect(batchDbPort.update).not.toHaveBeenCalled();
    expect(cancelBatchProcessUseCase.execute).toHaveBeenCalledWith(batch.id);
  });

  it('should throw if batch already started', async () => {
    const batch = useBatchProcessFactory({ status: BatchStatus.PROCESSING, totalFiles: 1, processedFiles: 0 }, em);
    createBatchProcessUseCase.execute.mockResolvedValue(batch);

    await expect(useCase.execute(mockUser, { templateId: 'template-123' })).rejects.toThrow(
      'Batch has already been started',
    );
  });
});
