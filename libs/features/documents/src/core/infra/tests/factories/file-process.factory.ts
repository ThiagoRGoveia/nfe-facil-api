import { faker } from '@faker-js/faker';
import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';
import { FileRecord, FileProcessStatus } from '@lib/documents/core/domain/entities/file-records.entity';
export class FileRecordFactory extends Factory<FileRecord> {
  model = FileRecord;

  definition(): Partial<FileRecord> {
    return {
      id: faker.string.uuid(),
      fileName: faker.system.fileName(),
      filePath: faker.system.filePath(),
      result: {},
      status: faker.helpers.arrayElement(Object.values(FileProcessStatus)),
      error: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };
  }
}

export function useFileRecordFactory(data: Partial<RequiredEntityData<FileRecord>>, em: EntityManager): FileRecord {
  return new FileRecordFactory(em).makeOne(data);
}

export async function useDbFileRecord(
  data: Partial<RequiredEntityData<FileRecord>>,
  em: EntityManager,
): Promise<FileRecord> {
  const fileProcess = useFileRecordFactory(data, em);
  await em.persistAndFlush(fileProcess);
  return fileProcess;
}
