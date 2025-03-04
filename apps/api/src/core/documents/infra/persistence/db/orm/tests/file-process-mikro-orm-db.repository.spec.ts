import { Test, TestingModule } from '@nestjs/testing';
import { FileProcessMikroOrmDbRepository } from '../file-process-mikro-orm-db.repository';
import { useUnitTestModule } from '@/infra/tests/base-unit-test.module';
import { EntityManager } from '@mikro-orm/postgresql';
import { FileRecord, FileProcessStatus } from '@/core/documents/domain/entities/file-records.entity';
import { useFileRecordFactory } from '@/core/documents/infra/tests/factories/file-process.factory';

describe('FileProcessMikroOrmDbRepository (unit)', () => {
  let em: EntityManager;
  let repository: FileProcessMikroOrmDbRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [useUnitTestModule()],
      providers: [FileProcessMikroOrmDbRepository],
    }).compile();

    em = module.get<EntityManager>(EntityManager);
    repository = module.get<FileProcessMikroOrmDbRepository>(FileProcessMikroOrmDbRepository);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('findByBatchPaginated', () => {
    it('should return paginated file processes for a given batch', async () => {
      const batchId = 'batch1';
      const limit = 5;
      const offset = 0;
      const expectedFiles: FileRecord[] = [
        useFileRecordFactory({ batchProcess: batchId }, em),
        useFileRecordFactory({ batchProcess: batchId }, em),
      ];

      const findSpy = jest.spyOn(em, 'find').mockResolvedValue(expectedFiles);

      const result = await repository.findByBatchPaginated(batchId, limit, offset);
      expect(result).toEqual(expectedFiles);
      expect(findSpy).toHaveBeenCalledWith(FileRecord, { batchProcess: { id: batchId } }, { offset, limit });
    });
  });

  describe('deleteByBatchId', () => {
    it('should call nativeDelete with proper parameters', async () => {
      const batchId = 'batch2';
      const nativeDeleteSpy = jest.spyOn(em, 'nativeDelete').mockResolvedValue(1);

      await repository.deleteByBatchId(batchId);
      expect(nativeDeleteSpy).toHaveBeenCalledWith(FileRecord, { batchProcess: { id: batchId } });
    });
  });

  describe('countByBatchAndStatus', () => {
    it('should return the count of file processes for a given batch and status', async () => {
      const batchId = 'batch3';
      const status = FileProcessStatus.COMPLETED; // assuming COMPLETED exists
      const countSpy = jest.spyOn(em, 'count').mockResolvedValue(4);

      const count = await repository.countByBatchAndStatus(batchId, status);
      expect(count).toBe(4);
      expect(countSpy).toHaveBeenCalledWith(FileRecord, { batchProcess: { id: batchId }, status });
    });
  });
});
