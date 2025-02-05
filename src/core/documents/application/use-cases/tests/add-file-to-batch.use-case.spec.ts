import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { AddFileToBatchUseCase } from '../add-file-to-batch.use-case';
import { BatchDbPort } from '../../ports/batch-db.port';
import { FileProcessDbPort } from '../../ports/file-process-db.port';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { User, UserRole } from '@/core/users/domain/entities/user.entity';
import { Readable } from 'stream';
import { BadRequestException } from '@nestjs/common';
import { BatchProcess } from '@/core/documents/domain/entities/batch-process.entity';
import { BatchStatus } from '@/core/documents/domain/entities/batch-process.entity';
import { useBatchProcessFactory } from '@/core/documents/infra/tests/factories/batch-process.factory';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { FileProcessStatus } from '@/core/documents/domain/entities/file-process.entity';

describe('AddFileToBatchUseCase', () => {
  let useCase: AddFileToBatchUseCase;
  let batchDbPort: jest.Mocked<BatchDbPort>;
  let fileStoragePort: jest.Mocked<FileStoragePort>;
  let fileProcessDbPort: jest.Mocked<FileProcessDbPort>;
  let em: EntityManager;
  let batch: BatchProcess;
  let mockUser: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        AddFileToBatchUseCase,
        {
          provide: BatchDbPort,
          useValue: createMock<BatchDbPort>(),
        },
        {
          provide: FileProcessDbPort,
          useValue: createMock<FileProcessDbPort>({
            create: jest.fn().mockImplementation((data) => data),
            save: jest.fn().mockResolvedValue(undefined),
          }),
        },
        {
          provide: FileStoragePort,
          useValue: createMock<FileStoragePort>({
            uploadFromStream: jest.fn().mockResolvedValue('s3://path/to/file'),
            delete: jest.fn().mockResolvedValue(undefined),
          }),
        },
        {
          provide: UuidAdapter,
          useValue: createMock<UuidAdapter>({
            generate: jest.fn().mockReturnValue('uuid-123'),
          }),
        },
      ],
    }).compile();

    useCase = module.get<AddFileToBatchUseCase>(AddFileToBatchUseCase);
    batchDbPort = module.get(BatchDbPort);
    fileStoragePort = module.get(FileStoragePort);
    fileProcessDbPort = module.get(FileProcessDbPort);
    em = module.get(EntityManager);
    mockUser = useUserFactory({ role: UserRole.CUSTOMER }, em);
    batch = useBatchProcessFactory({ user: mockUser, status: BatchStatus.CREATED }, em);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  function createValidParams(mockUser: User, batch: BatchProcess) {
    return {
      batchId: batch.id,
      file: { pipe: jest.fn() } as unknown as Readable,
      filename: 'test.pdf',
      mimetype: 'application/pdf',
      user: mockUser,
    };
  }

  it('should successfully add file to batch', async () => {
    const validParams = createValidParams(mockUser, batch);
    batchDbPort.findById.mockResolvedValueOnce(batch);
    const result = await useCase.execute(validParams);

    expect(batchDbPort.findById).toHaveBeenCalledWith(batch.id);
    expect(fileStoragePort.uploadFromStream).toHaveBeenCalledWith(
      `uploads/${mockUser.id}/batch/${batch.id}/uuid-123`,
      validParams.file,
      'application/pdf',
    );
    expect(fileProcessDbPort.create).toHaveBeenCalledWith({
      fileName: 'test.pdf',
      status: FileProcessStatus.PENDING,
      filePath: 's3://path/to/file',
      template: batch.template,
      batchProcess: batch,
    });
    expect(fileProcessDbPort.save).toHaveBeenCalled();
    expect(result).toMatchObject({ fileName: 'test.pdf' });
  });

  it('should throw when batch not found', async () => {
    const validParams = createValidParams(mockUser, batch);
    batchDbPort.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute(validParams)).rejects.toThrow(BadRequestException);
  });

  it('should throw when adding to non-CREATED status batch', async () => {
    const processingBatch = useBatchProcessFactory({ id: 'batch-123', status: BatchStatus.PROCESSING }, em);
    const validParams = createValidParams(mockUser, processingBatch);
    batchDbPort.findById.mockResolvedValueOnce(processingBatch);

    await expect(useCase.execute(validParams)).rejects.toThrow(BadRequestException);
  });

  it('should handle file upload failure', async () => {
    const validParams = createValidParams(mockUser, batch);
    batchDbPort.findById.mockResolvedValueOnce(batch);
    const uploadError = new Error('Upload failed');
    fileStoragePort.uploadFromStream.mockRejectedValueOnce(uploadError);

    await expect(useCase.execute(validParams)).rejects.toThrow('Failed to store file');
  });

  it('should rollback file upload on database save failure', async () => {
    const validParams = createValidParams(mockUser, batch);
    batchDbPort.findById.mockResolvedValueOnce(batch);
    const dbError = new Error('Database failure');
    fileProcessDbPort.save.mockRejectedValueOnce(dbError);

    await expect(useCase.execute(validParams)).rejects.toThrow('Failed to add file to batch');

    expect(fileStoragePort.delete).toHaveBeenCalledWith('s3://path/to/file');
  });
});
