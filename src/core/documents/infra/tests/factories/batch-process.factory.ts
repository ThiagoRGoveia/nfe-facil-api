import { faker } from '@faker-js/faker';
import { EntityManager } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';
import { BatchProcess, BatchStatus } from '@/core/documents/domain/entities/batch-process.entity';
import { User } from '@/core/users/domain/entities/user.entity';
import { Template } from '@/core/templates/domain/entities/template.entity';

export class BatchProcessFactory extends Factory<BatchProcess> {
  model = BatchProcess;

  definition(): Partial<BatchProcess> {
    return {
      id: faker.string.uuid(),
      status: faker.helpers.arrayElement(Object.values(BatchStatus)),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };
  }
}

export function useBatchProcessFactory(data: Partial<BatchProcess>, em: EntityManager): BatchProcess {
  return new BatchProcessFactory(em).makeOne(data);
}

export async function useDbBatchProcess(
  data: Partial<BatchProcess> & { owner: User; template: Template },
  em: EntityManager,
): Promise<BatchProcess> {
  const batch = useBatchProcessFactory(data, em);
  await em.persistAndFlush(batch);
  return batch;
}
