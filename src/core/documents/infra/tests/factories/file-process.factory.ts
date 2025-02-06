import { faker } from '@faker-js/faker';
import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';
import { FileToProcess, FileProcessStatus } from '@/core/documents/domain/entities/file-process.entity';
export class FileProcessFactory extends Factory<FileToProcess> {
  model = FileToProcess;

  definition(): Partial<FileToProcess> {
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

export function useFileProcessFactory(
  data: Partial<RequiredEntityData<FileToProcess>>,
  em: EntityManager,
): FileToProcess {
  return new FileProcessFactory(em).makeOne(data);
}

export async function useDbFileProcess(
  data: Partial<RequiredEntityData<FileToProcess>>,
  em: EntityManager,
): Promise<FileToProcess> {
  const fileProcess = useFileProcessFactory(data, em);
  await em.persistAndFlush(fileProcess);
  return fileProcess;
}
