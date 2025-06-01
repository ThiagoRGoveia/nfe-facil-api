import { Injectable } from '@nestjs/common';
import { BatchProcess } from '../../../../domain/entities/batch-process.entity';
import { BatchDbPort } from '../../../../application/ports/batch-db.port';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';

@Injectable()
export class BatchMikroOrmRepository extends EntityRepository(BatchProcess) implements BatchDbPort {
  async incrementProcessedFilesCount(id: BatchProcess['id']): Promise<BatchProcess> {
    const response = await this.em.execute<BatchProcess>(
      `UPDATE batch_processes SET processed_files = processed_files + 1 WHERE id = ? RETURNING *`,
      [id],
    );
    return this.em.map(BatchProcess, response[0]);
  }
}
