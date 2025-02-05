import { Injectable } from '@nestjs/common';
import { BatchProcess } from '../../../../domain/entities/batch-process.entity';
import { BatchDbPort } from '../../../../application/ports/batch-db.port';
import { BatchFile } from '../../../../domain/entities/batch-file.entity';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';

@Injectable()
export class BatchMikroOrmRepository extends EntityRepository(BatchProcess) implements BatchDbPort {
  async findByIdWithFiles(id: BatchProcess['id']): Promise<BatchProcess> {
    const batch = await this.em.findOne(BatchProcess, { id }, { populate: ['files'], strategy: 'joined' });
    if (!batch) {
      throw new Error(`Batch with ID ${id} not found`);
    }
    return batch;
  }

  async addFileToBatch(id: BatchProcess['id'], file: BatchFile): Promise<void> {
    const batch = await this.findByIdWithFiles(id);
    batch.addFile(file);
    batch.totalFiles++;
    await this.em.persistAndFlush(batch);
  }

  async removeFileFromBatch(id: BatchProcess['id'], fileId: BatchFile['id']): Promise<void> {
    const batch = await this.findByIdWithFiles(id);
    const fileToRemove = batch.files.find((f) => f.id === fileId);
    if (fileToRemove) {
      batch.files.remove(fileToRemove);
    }
    await this.em.persistAndFlush(batch);
  }

  async incrementProcessedFilesCount(id: BatchProcess['id']): Promise<void> {
    await this.em.execute(`UPDATE batch_processes SET processed_files = processed_files + 1 WHERE id = ?`, [id]);
  }
}
