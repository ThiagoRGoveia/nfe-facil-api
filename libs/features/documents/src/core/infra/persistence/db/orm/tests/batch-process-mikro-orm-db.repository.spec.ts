import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { BatchMikroOrmRepository } from '../batch-process-mikro-orm-db.repository';
import { useBatchProcessFactory } from '@lib/documents/core/infra/tests/factories/batch-process.factory';
import { useUserFactory } from '@lib/users/core/infra/tests/factories/users.factory';
import { useTemplateFactory } from '@lib/templates/core/infra/tests/factories/templates.factory';
import { useUnitTestModule } from '@dev-modules/dev-modules/tests/base-unit-test.module';

describe('BatchMikroOrmRepository (unit)', () => {
  let em: EntityManager;
  let repository: BatchMikroOrmRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [BatchMikroOrmRepository],
    }).compile();

    em = module.get(EntityManager);
    repository = module.get<BatchMikroOrmRepository>(BatchMikroOrmRepository);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('incrementProcessedFilesCount', () => {
    it('should execute raw SQL update query', async () => {
      // Arrange
      const batchId = '1';
      const mockUser = useUserFactory({}, em);
      const template = useTemplateFactory({ user: mockUser }, em);
      const batchProcess = useBatchProcessFactory({ user: mockUser, template }, em);
      const executeSpy = jest.spyOn(em, 'execute').mockImplementationOnce(() =>
        Promise.resolve([
          {
            id: batchProcess.id,
            status: batchProcess.status,
            template: batchProcess.template,
            files: batchProcess.files,
            user: batchProcess.user,
            total_files: batchProcess.totalFiles,
            processed_files: batchProcess.processedFiles,
            created_at: batchProcess.createdAt,
            updated_at: batchProcess.updatedAt,
          },
        ]),
      );

      // Act
      await repository.incrementProcessedFilesCount(batchId);

      // Assert
      expect(executeSpy).toHaveBeenCalledWith(
        `UPDATE batch_processes SET processed_files = processed_files + 1 WHERE id = ? RETURNING *`,
        [batchId],
      );
    });
  });
});
