import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { AsyncBatchProcessUseCase } from '../async-batch-process.use-case';
import { BatchDbPort } from '../../ports/batch-db.port';
import { FileProcessDbPort } from '../../ports/file-process-db.port';
import { QueuePort } from '@/infra/aws/sqs/ports/queue.port';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { useBatchProcessFactory } from '@/core/documents/infra/tests/factories/batch-process.factory';
import { useFileProcessFactory } from '@/core/documents/infra/tests/factories/file-process.factory';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { BatchStatus } from '@/core/documents/domain/entities/batch-process.entity';
import { NotFoundException } from '@nestjs/common';
import { BatchOperationForbiddenError } from '@/core/documents/domain/errors/batch-errors';
import { User } from '@/core/users/domain/entities/user.entity';
import { useTemplateFactory } from '@/core/templates/infra/tests/factories/templates.factory';

describe('AsyncBatchProcessUseCase', () => {
  let useCase: AsyncBatchProcessUseCase;
  let batchDbPort: jest.Mocked<BatchDbPort>;
  let fileProcessDbPort: jest.Mocked<FileProcessDbPort>;
  let queuePort: jest.Mocked<QueuePort>;
  let logger: jest.Mocked<PinoLogger>;
  let em: EntityManager;
  let mockUser: User;
  let configService: ConfigService;
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
          provide: QueuePort,
          useValue: createMock<QueuePort>(),
        },
        {
          provide: PinoLogger,
          useValue: createMock<PinoLogger>({
            error: jest.fn(),
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
    queuePort = module.get(QueuePort);
    logger = module.get(PinoLogger);
    configService = module.get(ConfigService);
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
      useFileProcessFactory({ fileName: 'file1.pdf', filePath: 's3://path/1' }, em),
      useFileProcessFactory({ fileName: 'file2.pdf', filePath: 's3://path/2' }, em),
    ];

    batchDbPort.findById.mockResolvedValue(batch);
    fileProcessDbPort.findByBatchPaginated.mockResolvedValueOnce(files).mockResolvedValueOnce([]);

    await useCase.execute(batch.id);

    expect(batchDbPort.update).toHaveBeenCalledWith(batch.id, { status: BatchStatus.PROCESSING });
    expect(queuePort.sendMessage).toHaveBeenCalledTimes(2);
    expect(queuePort.sendMessage).toHaveBeenNthCalledWith(1, 'test-queue', {
      user: batch.user,
      templateId: batch.template.id,
      file: {
        fileName: files[0].fileName,
        filePath: files[0].filePath,
      },
      batchId: batch.id,
    });
    expect(queuePort.sendMessage).toHaveBeenNthCalledWith(2, 'test-queue', {
      user: batch.user,
      templateId: batch.template.id,
      file: {
        fileName: files[1].fileName,
        filePath: files[1].filePath,
      },
      batchId: batch.id,
    });
  });

  it('should handle pagination for large batches', async () => {
    const batch = useBatchProcessFactory(
      { status: BatchStatus.CREATED, user: mockUser, template: useTemplateFactory({ user: mockUser }, em) },
      em,
    );
    const firstBatch = Array(100)
      .fill(null)
      .map(() => useFileProcessFactory({}, em));
    const secondBatch = Array(50)
      .fill(null)
      .map(() => useFileProcessFactory({}, em));

    batchDbPort.findById.mockResolvedValue(batch);
    fileProcessDbPort.findByBatchPaginated
      .mockResolvedValueOnce(firstBatch)
      .mockResolvedValueOnce(secondBatch)
      .mockResolvedValueOnce([]);

    await useCase.execute(batch.id);

    expect(fileProcessDbPort.findByBatchPaginated).toHaveBeenCalledTimes(2);
    expect(queuePort.sendMessage).toHaveBeenCalledTimes(150);
  });

  it('should continue processing when queue fails for some files', async () => {
    const batch = useBatchProcessFactory(
      { status: BatchStatus.CREATED, user: mockUser, template: useTemplateFactory({ user: mockUser }, em) },
      em,
    );
    const files = [
      useFileProcessFactory({ fileName: 'file1.pdf' }, em),
      useFileProcessFactory({ fileName: 'file2.pdf' }, em),
    ];

    batchDbPort.findById.mockResolvedValue(batch);
    fileProcessDbPort.findByBatchPaginated.mockResolvedValueOnce(files).mockResolvedValueOnce([]);
    queuePort.sendMessage.mockRejectedValueOnce(new Error('Queue error'));

    await useCase.execute(batch.id);

    expect(queuePort.sendMessage).toHaveBeenCalledTimes(2);
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
      () => new AsyncBatchProcessUseCase(batchDbPort, fileProcessDbPort, queuePort, configService, logger),
    ).toThrow('DOCUMENT_PROCESSING_QUEUE is not set');
  });
});
