import { faker } from '@faker-js/faker';
import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';
import { BatchProcess, BatchStatus } from '@lib/documents/core/domain/entities/batch-process.entity';
import { FileFormat } from '@lib/documents/core/domain/constants/file-formats';

export class BatchProcessFactory extends Factory<BatchProcess> {
  model = BatchProcess;

  definition(): Partial<BatchProcess> {
    return {
      id: faker.string.uuid(),
      status: faker.helpers.arrayElement(Object.values(BatchStatus)),
      processedFiles: faker.number.int({ min: 0, max: 20 }),
      totalFiles: faker.number.int({ min: 1, max: 20 }),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      requestedFormats: [faker.helpers.arrayElement(Object.values(FileFormat))],
    };
  }
}

export function useBatchProcessFactory(
  data: Partial<RequiredEntityData<BatchProcess>>,
  em: EntityManager,
): BatchProcess {
  return new BatchProcessFactory(em).makeOne(data);
}

export async function useDbBatchProcess(
  data: Partial<RequiredEntityData<BatchProcess>>,
  em: EntityManager,
): Promise<BatchProcess> {
  const batch = useBatchProcessFactory(data, em);
  await em.persistAndFlush(batch);
  return batch;
}
