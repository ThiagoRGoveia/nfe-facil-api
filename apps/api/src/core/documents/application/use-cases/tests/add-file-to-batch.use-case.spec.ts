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
import { BadRequestException } from '@nestjs/common';
import { BatchProcess } from '@/core/documents/domain/entities/batch-process.entity';
import { BatchStatus } from '@/core/documents/domain/entities/batch-process.entity';
import { useBatchProcessFactory } from '@/core/documents/infra/tests/factories/batch-process.factory';
import { useUserFactory } from '@/core/users/infra/tests/factories/users.factory';
import { FileProcessStatus } from '@/core/documents/domain/entities/file-process.entity';
import { ZipPort } from '@/infra/zip/zip.port';

describe('AddFileToBatchUseCase', () => {
  let useCase: AddFileToBatchUseCase;
  let batchDbPort: jest.Mocked<BatchDbPort>;
  let fileStoragePort: jest.Mocked<FileStoragePort>;
  let fileProcessDbPort: jest.Mocked<FileProcessDbPort>;
  let zipService: jest.Mocked<ZipPort>;
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
            uploadFromBuffer: jest.fn().mockResolvedValue('s3://path/to/file'),
            delete: jest.fn().mockResolvedValue(undefined),
          }),
        },
        {
          provide: ZipPort,
          useValue: createMock<ZipPort>({
            extractFiles: jest.fn().mockResolvedValue([]),
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
    zipService = module.get(ZipPort);
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
      files: [
        {
          file: Buffer.from('pdf content'),
          filename: 'test.pdf',
          mimetype: 'application/pdf',
        },
        {
          file: Buffer.from('zip content'),
          filename: 'test.zip',
          mimetype: 'application/zip',
        },
      ],
      user: mockUser,
    };
  }

  it('should successfully add PDF file to batch', async () => {
    const validParams = createValidParams(mockUser, batch);
    batchDbPort.findById.mockResolvedValueOnce(batch);

    const result = await useCase.execute(validParams);

    expect(batchDbPort.findById).toHaveBeenCalledWith(batch.id);
    expect(fileStoragePort.uploadFromBuffer).toHaveBeenCalledWith(
      `uploads/${mockUser.id}/batch/${batch.id}/uuid-123`,
      expect.any(Buffer),
      'application/pdf',
    );
    expect(fileProcessDbPort.create).toHaveBeenCalledWith({
      fileName: 'test.pdf',
      status: FileProcessStatus.PENDING,
      filePath: 's3://path/to/file',
      template: batch.template,
      batchProcess: batch,
      user: mockUser,
    });
    expect(fileProcessDbPort.save).toHaveBeenCalled();
    expect(result[0]).toMatchObject({ fileName: 'test.pdf' });
  });

  it('should handle zip file processing', async () => {
    const validParams = createValidParams(mockUser, batch);
    batchDbPort.findById.mockResolvedValueOnce(batch);
    const pdfContent = Buffer.from('pdf content');
    zipService.extractFiles.mockResolvedValue([
      { name: 'file1.pdf', content: pdfContent, path: 'file1.pdf' },
      { name: 'file2.pdf', content: pdfContent, path: 'file2.pdf' },
    ]);

    const result = await useCase.execute(validParams);

    expect(zipService.extractFiles).toHaveBeenCalledWith(expect.any(Buffer));
    expect(fileStoragePort.uploadFromBuffer).toHaveBeenCalledTimes(3);
    expect(fileStoragePort.uploadFromBuffer).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(`uploads/${mockUser.id}/batch/${batch.id}/`),
      pdfContent,
      'application/pdf',
    );
    expect(result).toHaveLength(3); // 1 PDF + 2 from ZIP
  });

  it('should reject zip with non-PDF files', async () => {
    const validParams = createValidParams(mockUser, batch);
    batchDbPort.findById.mockResolvedValueOnce(batch);
    const imageContent = Buffer.from('fake image content');
    zipService.extractFiles.mockResolvedValue([{ name: 'file.jpg', content: imageContent, path: 'file.jpg' }]);

    await expect(useCase.execute(validParams)).rejects.toThrow('contains non-PDF files');
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
    fileStoragePort.uploadFromBuffer.mockRejectedValueOnce(uploadError);

    await expect(useCase.execute(validParams)).rejects.toThrow('Failed to store file');
    expect(fileStoragePort.uploadFromBuffer).toHaveBeenCalledWith(
      expect.stringContaining(`uploads/${mockUser.id}/batch/${batch.id}/`),
      expect.any(Buffer),
      'application/pdf',
    );
  });

  it('should rollback file uploads on database save failure', async () => {
    const validParams = createValidParams(mockUser, batch);
    batchDbPort.findById.mockResolvedValueOnce(batch);
    const dbError = new Error('Database failure');
    fileProcessDbPort.save.mockRejectedValueOnce(dbError);

    await expect(useCase.execute(validParams)).rejects.toThrow('Failed to add files to batch');

    expect(fileStoragePort.delete).toHaveBeenCalled();
    expect(fileStoragePort.delete).toHaveBeenCalledWith(expect.stringContaining('s3://path/to'));
  });
});
