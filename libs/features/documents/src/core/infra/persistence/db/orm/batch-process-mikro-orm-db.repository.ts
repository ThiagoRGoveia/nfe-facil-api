import { Injectable } from '@nestjs/common';
import { BatchProcess } from '../../../../domain/entities/batch-process.entity';
import { BatchDbPort } from '../../../../application/ports/batch-db.port';
import { EntityRepository } from '@lib/database/infra/persistence/repositories/_base-mikro-orm-db.repository';

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

export const BatchMikroOrmRepositoryProvider = {
  provide: BatchDbPort,
  useClass: BatchMikroOrmRepository,
};
