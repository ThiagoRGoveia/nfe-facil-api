import { Injectable } from '@nestjs/common';
import { BatchProcess } from '../../../../domain/entities/batch-process.entity';
import { BatchDbPort } from '../../../../application/ports/batch-db.port';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';

@Injectable()
export class BatchMikroOrmRepository extends EntityRepository(BatchProcess) implements BatchDbPort {
  async incrementProcessedFilesCount(id: BatchProcess['id']): Promise<void> {
    await this.em.execute(`UPDATE batch_processes SET processed_files = processed_files + 1 WHERE id = ?`, [id]);
  }
}
