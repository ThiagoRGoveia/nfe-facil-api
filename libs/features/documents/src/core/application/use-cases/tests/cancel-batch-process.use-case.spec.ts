import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { CancelBatchProcessUseCase } from '../cancel-batch-process.use-case';
import { BatchDbPort } from '../../ports/batch-db.port';
import { FileProcessDbPort } from '../../ports/file-process-db.port';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { BadRequestException } from '@nestjs/common';
import { BatchStatus } from '@/core/documents/domain/entities/batch-process.entity';
import { useBatchProcessFactory } from '@/core/documents/infra/tests/factories/batch-process.factory';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { BatchOperationForbiddenError } from '@/core/documents/domain/errors/batch-errors';

describe('CancelBatchProcessUseCase', () => {
  let useCase: CancelBatchProcessUseCase;
  let batchDbPort: jest.Mocked<BatchDbPort>;
  let fileProcessDbPort: jest.Mocked<FileProcessDbPort>;
  let fileStoragePort: jest.Mocked<FileStoragePort>;
  let em: EntityManager;
  let mockUser: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        CancelBatchProcessUseCase,
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
            deleteByBatchId: jest.fn().mockResolvedValue(undefined),
          }),
        },
      ],
    }).compile();

    useCase = module.get<CancelBatchProcessUseCase>(CancelBatchProcessUseCase);
    batchDbPort = module.get(BatchDbPort);
    fileProcessDbPort = module.get(FileProcessDbPort);
    fileStoragePort = module.get(FileStoragePort);
    em = module.get(EntityManager);
    mockUser = useUserFactory({}, em);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should successfully cancel a CREATED status batch', async () => {
    const batch = useBatchProcessFactory({ user: mockUser, status: BatchStatus.CREATED }, em);
    batchDbPort.findById.mockResolvedValue(batch);

    await useCase.execute(batch.id);

    expect(fileStoragePort.deleteFolder).toHaveBeenCalledWith(`uploads/${mockUser.id}/batch/${batch.id}`);
    expect(fileProcessDbPort.deleteByBatchId).toHaveBeenCalledWith(batch.id);
    expect(batchDbPort.update).toHaveBeenCalledWith(batch.id, { status: BatchStatus.CANCELLED });
    expect(batchDbPort.save).toHaveBeenCalled();
  });

  it('should throw when batch not found', async () => {
    batchDbPort.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent-id')).rejects.toThrow(BadRequestException);
  });

  it('should throw when trying to cancel non-CREATED status batch', async () => {
    const processingBatch = useBatchProcessFactory({ status: BatchStatus.PROCESSING }, em);
    batchDbPort.findById.mockResolvedValue(processingBatch);

    await expect(useCase.execute(processingBatch.id)).rejects.toThrow('Cannot cancel a batch that has already started');
  });

  it('should handle partial failures during cleanup', async () => {
    const batch = useBatchProcessFactory({ user: mockUser, status: BatchStatus.CREATED }, em);
    batchDbPort.findById.mockResolvedValue(batch);
    const storageError = new Error('S3 failure');
    fileStoragePort.deleteFolder.mockRejectedValueOnce(storageError);

    await expect(useCase.execute(batch.id)).rejects.toThrow('S3 failure');

    // Verify database changes still attempted
    expect(batchDbPort.update).not.toHaveBeenCalled();
  });

  it('should maintain cancelled status if already cancelled', async () => {
    const cancelledBatch = useBatchProcessFactory({ status: BatchStatus.CANCELLED }, em);
    batchDbPort.findById.mockResolvedValue(cancelledBatch);

    await expect(useCase.execute(cancelledBatch.id)).rejects.toThrow(BatchOperationForbiddenError);

    expect(fileStoragePort.deleteFolder).not.toHaveBeenCalled();
  });
});
