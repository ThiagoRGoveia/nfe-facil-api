import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { CreateBatchProcessUseCase } from '../create-batch-process.use-case';
import { TemplateDbPort } from '@lib/templates/core/application/ports/templates-db.port';
import { BatchDbPort } from '../../ports/batch-db.port';
import { FileProcessDbPort } from '../../ports/file-process-db.port';
import { FileStoragePort } from '@lib/file-storage/core/ports/file-storage.port';
import { UuidAdapter } from '@lib/uuid/core/uuid.adapter';
import { useUserFactory } from '@lib/users/core/infra/tests/factories/users.factory';
import { useTemplateFactory } from '@lib/templates/core/infra/tests/factories/templates.factory';
import { UserRole } from '@lib/users/core/domain/entities/user.entity';
import { BatchStatus } from '@lib/documents/core/domain/entities/batch-process.entity';
import { ZipPort } from '@lib/zip/core/zip.port';

describe('CreateBatchProcessUseCase', () => {
  let useCase: CreateBatchProcessUseCase;
  let templateDbPort: jest.Mocked<TemplateDbPort>;
  let batchDbPort: jest.Mocked<BatchDbPort>;
  let fileStoragePort: jest.Mocked<FileStoragePort>;
  let zipService: jest.Mocked<ZipPort>;
  let em: EntityManager;
  let mockUser: ReturnType<typeof useUserFactory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        CreateBatchProcessUseCase,
        {
          provide: TemplateDbPort,
          useValue: createMock<TemplateDbPort>({
            findById: jest.fn(),
          }),
        },
        {
          provide: BatchDbPort,
          useValue: createMock<BatchDbPort>({
            create: jest.fn().mockImplementation((data) => ({
              ...data,
              id: 'batch-123',
              status: BatchStatus.CREATED,
            })),
            save: jest.fn().mockResolvedValue(undefined),
          }),
        },
        {
          provide: FileProcessDbPort,
          useValue: createMock<FileProcessDbPort>({
            create: jest.fn().mockImplementation((data) => data),
            save: jest.fn().mockResolvedValue(undefined),
          }),
        },
      ],
    })
      .overrideProvider(UuidAdapter)
      .useValue(
        createMock<UuidAdapter>({
          generate: jest.fn().mockReturnValue('file-uuid-123'),
        }),
      )
      .overrideProvider(ZipPort)
      .useValue(
        createMock<ZipPort>({
          extractFiles: jest.fn().mockResolvedValue([]),
        }),
      )
      .compile();

    useCase = module.get<CreateBatchProcessUseCase>(CreateBatchProcessUseCase);
    templateDbPort = module.get(TemplateDbPort);
    batchDbPort = module.get(BatchDbPort);
    fileStoragePort = module.get(FileStoragePort);
    zipService = module.get(ZipPort);
    em = module.get(EntityManager);
    mockUser = useUserFactory({ role: UserRole.CUSTOMER }, em);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const validDto = {
    templateId: 'template-123',
    files: [
      {
        fileName: 'test.pdf',
        data: Buffer.from('test'),
      },
      {
        fileName: 'test.zip',
        data: Buffer.from('test'),
      },
    ],
  };

  it('should create empty batch successfully', async () => {
    const template = useTemplateFactory({ user: mockUser }, em);
    templateDbPort.findById.mockResolvedValue(template);

    const result = await useCase.execute(mockUser, validDto);

    expect(batchDbPort.create).toHaveBeenCalledWith(
      expect.objectContaining({
        template,
        user: mockUser,
        status: BatchStatus.CREATED,
      }),
    );
    expect(result.status).toBe(BatchStatus.CREATED);
  });

  it('should reject invalid template access', async () => {
    const otherUserTemplate = useTemplateFactory({ user: useUserFactory({}, em), isPublic: false }, em);
    templateDbPort.findById.mockResolvedValue(otherUserTemplate);

    await expect(useCase.execute(mockUser, validDto)).rejects.toThrow("You don't have access to this template");
  });

  it('should handle zip file processing', async () => {
    const template = useTemplateFactory({ user: mockUser }, em);
    templateDbPort.findById.mockResolvedValue(template);
    zipService.extractFiles.mockResolvedValue([
      { name: 'file1.pdf', content: Buffer.from('pdf-content'), path: 'file1.pdf' },
      { name: 'file2.pdf', content: Buffer.from('pdf-content'), path: 'file2.pdf' },
    ]);

    const result = await useCase.execute(mockUser, validDto);

    expect(zipService.extractFiles).toHaveBeenCalledWith(validDto.files[0].data);
    expect(fileStoragePort.uploadFromBuffer).toHaveBeenCalledTimes(3);
    expect(batchDbPort.update).toHaveBeenCalledWith(result.id, { totalFiles: 3 });
  });

  it('should reject zip with non-PDF files', async () => {
    const template = useTemplateFactory({ user: mockUser }, em);
    templateDbPort.findById.mockResolvedValue(template);
    zipService.extractFiles.mockResolvedValue([{ name: 'file.jpg', content: Buffer.from('image'), path: 'file.jpg' }]);

    await expect(useCase.execute(mockUser, validDto)).rejects.toThrow('Zip file test.zip contains non-PDF files');
  });

  it('should rollback on database failure', async () => {
    const template = useTemplateFactory({ user: mockUser }, em);
    templateDbPort.findById.mockResolvedValue(template);
    batchDbPort.save.mockRejectedValue(new Error('DB failure'));

    await expect(useCase.execute(mockUser, validDto)).rejects.toThrow('DB failure');

    expect(fileStoragePort.deleteFolder).toHaveBeenCalled();
  });
});
