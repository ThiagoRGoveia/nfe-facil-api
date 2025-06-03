import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@dev-modules/dev-modules/tests/base-unit-test.module';
import { AsyncBatchProcessUseCase } from '../async-batch-process.use-case';
import { BatchDbPort } from '../../ports/batch-db.port';
import { FileProcessDbPort } from '../../ports/file-process-db.port';
import { ConfigService } from '@nestjs/config';
import { useBatchProcessFactory } from '@lib/documents/core/infra/tests/factories/batch-process.factory';
import { useFileRecordFactory } from '@lib/documents/core/infra/tests/factories/file-process.factory';
import { useUserFactory } from '@lib/users/core/infra/tests/factories/users.factory';
import { BatchStatus } from '@lib/documents/core/domain/entities/batch-process.entity';
import { NotFoundException } from '@nestjs/common';
import { BatchOperationForbiddenError } from '@lib/documents/core/domain/errors/batch-errors';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { useTemplateFactory } from '@lib/templates/core/infra/tests/factories/templates.factory';
import { TriggerFileProcessUseCase } from '../trigger-file-process.use-case';

describe('AsyncBatchProcessUseCase', () => {
  let useCase: AsyncBatchProcessUseCase;
  let batchDbPort: jest.Mocked<BatchDbPort>;
  let fileProcessDbPort: jest.Mocked<FileProcessDbPort>;
  let em: EntityManager;
  let mockUser: User;
  let configService: ConfigService;
  let triggerFileProcessUseCase: TriggerFileProcessUseCase;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        AsyncBatchProcessUseCase,
        {
          provide: BatchDbPort,
          useValue: createMock<BatchDbPort>({
            findById: jest.fn(),
            update: jest.fn(),
            save: jest.fn().mockResolvedValue(undefined),
          }),
        },
        {
          provide: FileProcessDbPort,
          useValue: createMock<FileProcessDbPort>({
            findByBatchPaginated: jest.fn().mockResolvedValue([]),
          }),
        },
        {
          provide: TriggerFileProcessUseCase,
          useValue: createMock<TriggerFileProcessUseCase>({
            execute: jest.fn(),
          }),
        },
      ],
    })
      .overrideProvider(ConfigService)
      .useValue(createMock<ConfigService>({ get: jest.fn().mockReturnValue('test-queue') }))
      .compile();

    useCase = module.get<AsyncBatchProcessUseCase>(AsyncBatchProcessUseCase);
    batchDbPort = module.get(BatchDbPort);
    fileProcessDbPort = module.get(FileProcessDbPort);
    configService = module.get(ConfigService);
    triggerFileProcessUseCase = module.get(TriggerFileProcessUseCase);
    em = module.get(EntityManager);
    mockUser = useUserFactory({}, em);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should process batch and queue files successfully', async () => {
    const batch = useBatchProcessFactory(
      { status: BatchStatus.CREATED, user: mockUser, template: useTemplateFactory({ user: mockUser }, em) },
      em,
    );
    const files = [
      useFileRecordFactory({ fileName: 'file1.pdf', filePath: 's3://path/1' }, em),
      useFileRecordFactory({ fileName: 'file2.pdf', filePath: 's3://path/2' }, em),
    ];

    batchDbPort.findById.mockResolvedValue(batch);
    fileProcessDbPort.findByBatchPaginated.mockResolvedValueOnce(files).mockResolvedValueOnce([]);

    await useCase.execute(batch.id);

    expect(batchDbPort.update).toHaveBeenCalledWith(batch.id, { status: BatchStatus.PROCESSING });
    expect(triggerFileProcessUseCase.execute).toHaveBeenCalledTimes(2);
    expect(triggerFileProcessUseCase.execute).toHaveBeenNthCalledWith(1, files[0]);
    expect(triggerFileProcessUseCase.execute).toHaveBeenNthCalledWith(2, files[1]);
  });

  it('should handle pagination for large batches', async () => {
    const batch = useBatchProcessFactory(
      { status: BatchStatus.CREATED, user: mockUser, template: useTemplateFactory({ user: mockUser }, em) },
      em,
    );
    const firstBatch = Array(100)
      .fill(null)
      .map(() => useFileRecordFactory({}, em));
    const secondBatch = Array(50)
      .fill(null)
      .map(() => useFileRecordFactory({}, em));

    batchDbPort.findById.mockResolvedValue(batch);
    fileProcessDbPort.findByBatchPaginated
      .mockResolvedValueOnce(firstBatch)
      .mockResolvedValueOnce(secondBatch)
      .mockResolvedValueOnce([]);

    await useCase.execute(batch.id);

    expect(fileProcessDbPort.findByBatchPaginated).toHaveBeenCalledTimes(2);
    expect(triggerFileProcessUseCase.execute).toHaveBeenCalledTimes(150);
  });

  it('should continue processing when queue fails for some files', async () => {
    const batch = useBatchProcessFactory(
      { status: BatchStatus.CREATED, user: mockUser, template: useTemplateFactory({ user: mockUser }, em) },
      em,
    );
    const files = [
      useFileRecordFactory({ fileName: 'file1.pdf' }, em),
      useFileRecordFactory({ fileName: 'file2.pdf' }, em),
    ];

    batchDbPort.findById.mockResolvedValue(batch);
    fileProcessDbPort.findByBatchPaginated.mockResolvedValueOnce(files).mockResolvedValueOnce([]);
    (triggerFileProcessUseCase.execute as jest.Mock).mockRejectedValueOnce(new Error('Queue error'));

    await useCase.execute(batch.id);

    expect(triggerFileProcessUseCase.execute).toHaveBeenCalledTimes(2);
  });

  it('should throw when batch not found', async () => {
    batchDbPort.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent-id')).rejects.toThrow(NotFoundException);
  });

  it('should throw when batch is not in CREATED status', async () => {
    const batch = useBatchProcessFactory({ status: BatchStatus.PROCESSING }, em);
    batchDbPort.findById.mockResolvedValue(batch);

    await expect(useCase.execute(batch.id)).rejects.toThrow(BatchOperationForbiddenError);
  });

  it('should throw when queue name is not configured', () => {
    jest.spyOn(configService, 'get').mockReturnValue(null);

    expect(
      () => new AsyncBatchProcessUseCase(batchDbPort, fileProcessDbPort, configService, triggerFileProcessUseCase),
    ).toThrow('DOCUMENT_PROCESSING_QUEUE is not set');
  });
});
