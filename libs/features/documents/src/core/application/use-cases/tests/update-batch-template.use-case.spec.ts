import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/postgresql';
import { useUnitTestModule } from '@dev-modules/dev-modules/tests/base-unit-test.module';
import { UpdateBatchTemplateUseCase } from '../update-batch-template.use-case';
import { BatchDbPort } from '../../ports/batch-db.port';
import { TemplateDbPort } from '@lib/templates/core/application/ports/templates-db.port';
import { useBatchProcessFactory } from '@lib/documents/core/infra/tests/factories/batch-process.factory';
import { useUserFactory } from '@lib/users/core/infra/tests/factories/users.factory';
import { useTemplateFactory } from '@lib/templates/core/infra/tests/factories/templates.factory';
import { BatchStatus } from '@lib/documents/core/domain/entities/batch-process.entity';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import { BatchOperationForbiddenError } from '@lib/documents/core/domain/errors/batch-errors';

describe('UpdateBatchTemplateUseCase', () => {
  let useCase: UpdateBatchTemplateUseCase;
  let batchDbPort: jest.Mocked<BatchDbPort>;
  let templateDbPort: jest.Mocked<TemplateDbPort>;
  let em: EntityManager;
  let mockUser: User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [
        UpdateBatchTemplateUseCase,
        {
          provide: BatchDbPort,
          useValue: createMock<BatchDbPort>({
            findById: jest.fn(),
            update: jest.fn(),
            save: jest.fn().mockResolvedValue(undefined),
          }),
        },
        {
          provide: TemplateDbPort,
          useValue: createMock<TemplateDbPort>({
            findById: jest.fn(),
          }),
        },
      ],
    }).compile();

    useCase = module.get<UpdateBatchTemplateUseCase>(UpdateBatchTemplateUseCase);
    batchDbPort = module.get(BatchDbPort);
    templateDbPort = module.get(TemplateDbPort);
    em = module.get(EntityManager);
    mockUser = useUserFactory({}, em);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should update template for CREATED status batch', async () => {
    const batch = useBatchProcessFactory({ status: BatchStatus.CREATED, user: mockUser }, em);
    const newTemplate = useTemplateFactory({}, em);
    batchDbPort.findById.mockResolvedValue(batch);
    templateDbPort.findById.mockResolvedValue(newTemplate);
    newTemplate.isAccessibleByUser = jest.fn().mockReturnValue(true);

    await useCase.execute({ batchId: batch.id, templateId: newTemplate.id, user: mockUser });

    expect(batchDbPort.update).toHaveBeenCalledWith(batch.id, { template: newTemplate });
    expect(batchDbPort.save).toHaveBeenCalled();
  });

  it('should throw when template is not accessible by user', async () => {
    const batch = useBatchProcessFactory({ status: BatchStatus.CREATED, user: mockUser }, em);
    const newTemplate = useTemplateFactory({}, em);
    batchDbPort.findById.mockResolvedValue(batch);
    templateDbPort.findById.mockResolvedValue(newTemplate);
    newTemplate.isAccessibleByUser = jest.fn().mockReturnValue(false);

    await expect(useCase.execute({ batchId: batch.id, templateId: newTemplate.id, user: mockUser })).rejects.toThrow(
      BatchOperationForbiddenError,
    );
  });

  it('should throw when template is not found', async () => {
    const batch = useBatchProcessFactory({ status: BatchStatus.CREATED, user: mockUser }, em);
    batchDbPort.findById.mockResolvedValue(batch);
    templateDbPort.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ batchId: batch.id, templateId: 'invalid-template', user: mockUser }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw when batch is not in CREATED status', async () => {
    const processingBatch = useBatchProcessFactory({ status: BatchStatus.PROCESSING, user: mockUser }, em);
    batchDbPort.findById.mockResolvedValue(processingBatch);

    await expect(
      useCase.execute({ batchId: processingBatch.id, templateId: 'new-template-123', user: mockUser }),
    ).rejects.toThrow(BatchOperationForbiddenError);
  });

  it('should handle database save failure', async () => {
    const batch = useBatchProcessFactory({ status: BatchStatus.CREATED, user: mockUser }, em);
    const newTemplate = useTemplateFactory({}, em);
    batchDbPort.findById.mockResolvedValue(batch);
    templateDbPort.findById.mockResolvedValue(newTemplate);
    newTemplate.isAccessibleByUser = jest.fn().mockReturnValue(true);
    batchDbPort.save.mockRejectedValueOnce(new Error('Database error'));

    await expect(useCase.execute({ batchId: batch.id, templateId: 'template-123', user: mockUser })).rejects.toThrow(
      'Database error',
    );
  });
});
