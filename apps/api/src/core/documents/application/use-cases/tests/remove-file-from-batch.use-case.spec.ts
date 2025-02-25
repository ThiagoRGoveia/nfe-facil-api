import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { RemoveFileFromBatchUseCase } from '../remove-file-from-batch.use-case';
import { FileProcessDbPort } from '../../ports/file-process-db.port';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { BadRequestException } from '@nestjs/common';
import { BatchProcess } from '@/core/documents/domain/entities/batch-process.entity';
import { FileToProcess } from '@/core/documents/domain/entities/file-process.entity';
import { useBatchProcessFactory } from '@/core/documents/infra/tests/factories/batch-process.factory';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { useFileProcessFactory } from '@/core/documents/infra/tests/factories/file-process.factory';
import { User } from '@/core/users/domain/entities/user.entity';
import { UserRole } from '@/core/users/domain/entities/user.entity';

describe('RemoveFileFromBatchUseCase', () => {
  let useCase: RemoveFileFromBatchUseCase;
  let fileProcessDbPort: jest.Mocked<FileProcessDbPort>;
  let fileStoragePort: jest.Mocked<FileStoragePort>;
  let em: EntityManager;
  let batch: BatchProcess;
  let file: FileToProcess;
  let mockUser: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        RemoveFileFromBatchUseCase,
        {
          provide: FileProcessDbPort,
          useValue: createMock<FileProcessDbPort>({
            findById: jest.fn(),
            delete: jest.fn().mockResolvedValue(undefined),
          }),
        },
      ],
    }).compile();

    useCase = module.get<RemoveFileFromBatchUseCase>(RemoveFileFromBatchUseCase);
    fileProcessDbPort = module.get(FileProcessDbPort);
    fileStoragePort = module.get(FileStoragePort);
    em = module.get(EntityManager);

    mockUser = useUserFactory({ role: UserRole.CUSTOMER }, em);
    batch = useBatchProcessFactory({ user: mockUser }, em);
    file = useFileProcessFactory({ batchProcess: batch, filePath: 's3://path/to/file' }, em);
  });

  function createValidParams() {
    return {
      batchId: batch.id,
      fileId: file.id,
    };
  }

  it('should successfully remove file from batch', async () => {
    fileProcessDbPort.findById.mockResolvedValueOnce(file);

    await useCase.execute(createValidParams());

    expect(fileStoragePort.delete).toHaveBeenCalledWith(file.filePath);
    expect(fileProcessDbPort.delete).toHaveBeenCalledWith(file.id);
  });

  it('should throw when file not found in batch', async () => {
    fileProcessDbPort.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute(createValidParams())).rejects.toThrow(BadRequestException);
  });

  it('should throw when file belongs to different batch', async () => {
    const otherBatch = useBatchProcessFactory({ user: mockUser }, em);
    const foreignFile = useFileProcessFactory({ batchProcess: otherBatch }, em);
    fileProcessDbPort.findById.mockResolvedValueOnce(foreignFile);

    await expect(useCase.execute(createValidParams())).rejects.toThrow('File not found in batch');
  });

  it('should not call storage delete when no filePath exists', async () => {
    const noPathFile = useFileProcessFactory({ batchProcess: batch, filePath: null }, em);
    fileProcessDbPort.findById.mockResolvedValueOnce(noPathFile);

    await useCase.execute({ batchId: batch.id, fileId: noPathFile.id });

    expect(fileStoragePort.delete).not.toHaveBeenCalled();
    expect(fileProcessDbPort.delete).toHaveBeenCalledWith(noPathFile.id);
  });

  it('should handle storage deletion failure', async () => {
    fileProcessDbPort.findById.mockResolvedValueOnce(file);
    const storageError = new Error('Storage failure');
    fileStoragePort.delete.mockRejectedValueOnce(storageError);

    await expect(useCase.execute(createValidParams())).rejects.toThrow('Storage failure');
  });
});
