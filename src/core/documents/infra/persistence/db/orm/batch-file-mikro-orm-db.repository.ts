import { Injectable } from '@nestjs/common';
import { BatchFile } from '../../../../domain/entities/batch-file.entity';
import { BatchFileDbPort } from '../../../../application/ports/batch-file-db.port';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';

@Injectable()
export class BatchFileMikroOrmRepository extends EntityRepository(BatchFile) implements BatchFileDbPort {
  async findByBatchPaginated(batchId: string, limit: number, offset: number): Promise<BatchFile[]> {
    const batch = await this.em.find(BatchFile, { batchProcess: { id: batchId } }, { offset, limit });
    if (!batch) {
      throw new Error(`Batch with ID ${batchId} not found`);
    }
    return batch;
  }
}
