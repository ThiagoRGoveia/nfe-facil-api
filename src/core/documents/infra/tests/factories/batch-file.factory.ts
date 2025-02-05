import { faker } from '@faker-js/faker';
import { EntityManager } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';
import { BatchFile, FileStatus } from '@/core/documents/domain/entities/batch-file.entity';
import { BatchProcess } from '@/core/documents/domain/entities/batch-process.entity';

export class BatchFileFactory extends Factory<BatchFile> {
  model = BatchFile;

  definition(): Partial<BatchFile> {
    return {
      id: faker.string.uuid(),
      filename: faker.system.fileName(),
      status: faker.helpers.arrayElement(Object.values(FileStatus)),
      webhookUrl: faker.internet.url(),
      storagePath: `s3://${faker.string.uuid()}`,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };
  }
}

export function useBatchFileFactory(data: Partial<BatchFile>, em: EntityManager): BatchFile {
  return new BatchFileFactory(em).makeOne(data);
}

export async function useDbBatchFile(
  data: Partial<BatchFile> & { batchProcess: BatchProcess },
  em: EntityManager,
): Promise<BatchFile> {
  const file = useBatchFileFactory(data, em);
  await em.persistAndFlush(file);
  return file;
}
