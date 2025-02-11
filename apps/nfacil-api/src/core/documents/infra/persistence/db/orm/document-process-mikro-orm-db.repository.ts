import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';
import { FileProcessDbPort } from '@/core/documents/application/ports/file-process-db.port';
import { FileToProcess, FileProcessStatus } from '@/core/documents/domain/entities/file-process.entity';

@Injectable()
export class FileProcessMikroOrmDbRepository extends EntityRepository(FileToProcess) implements FileProcessDbPort {
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
