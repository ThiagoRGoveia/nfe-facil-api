import { EntityManager } from '@mikro-orm/postgresql';
import { Test, TestingModule } from '@nestjs/testing';
import { BatchMikroOrmRepository } from '../batch-process-mikro-orm-db.repository';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';

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
      const executeSpy = jest.spyOn(em, 'execute').mockImplementationOnce(() => Promise.resolve({ id: 1 }));

      // Act
      await repository.incrementProcessedFilesCount(batchId);

      // Assert
      expect(executeSpy).toHaveBeenCalledWith(
        `UPDATE batch_processes SET processed_files = processed_files + 1 WHERE id = ?`,
        [batchId],
      );
    });
  });
});
