import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';
import { FileProcessDbPort } from '@/core/documents/application/ports/file-process-db.port';
import { FileToProcess, FileProcessStatus } from '@/core/documents/domain/entities/file-process.entity';
import { RequiredEntityData } from '@mikro-orm/core';

@Injectable()
export class FileProcessMikroOrmDbRepository extends EntityRepository(FileToProcess) implements FileProcessDbPort {
  create(process: RequiredEntityData<FileToProcess>): FileToProcess {
    const newProcess = this.em.create(FileToProcess, process);
    this.em.persist(newProcess);
    return newProcess;
  }

  update(id: string, process: Partial<RequiredEntityData<FileToProcess>>): FileToProcess {
    const existingProcess = this.em.getReference(FileToProcess, id);
    this.em.assign(existingProcess, process);
    return existingProcess;
  }

  async findByTemplateId(templateId: string): Promise<FileToProcess[]> {
    return this.em.find(FileToProcess, { template: { id: templateId } });
  }

  async findByBatchPaginated(batchId: string, limit: number, offset: number): Promise<FileToProcess[]> {
    return this.em.find(FileToProcess, { batchProcess: { id: batchId } }, { offset, limit });
  }

  async deleteByBatchId(batchId: string): Promise<void> {
    await this.em.nativeDelete(FileToProcess, { batchProcess: { id: batchId } });
  }

  async countByBatchAndStatus(batchId: string, status: FileProcessStatus): Promise<number> {
    return this.em.count(FileToProcess, { batchProcess: { id: batchId }, status });
  }
}
