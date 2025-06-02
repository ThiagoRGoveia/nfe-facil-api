import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@lib/database/infra/persistence/repositories/_base-mikro-orm-db.repository';
import { PublicFileProcess } from '@lib/documents/core/domain/entities/public-file-process.entity';
import { PublicFileProcessDbPort } from '@lib/documents/core/application/ports/public-file-process-db.port';

@Injectable()
export class PublicFileProcessMikroOrmDbRepository
  extends EntityRepository(PublicFileProcess)
  implements PublicFileProcessDbPort
{
  findByIds(ids: string[]): Promise<PublicFileProcess[]> {
    return this.em.find(PublicFileProcess, { id: { $in: ids } });
  }

  async deleteOlderThan(date: Date): Promise<void> {
    await this.em.nativeDelete(PublicFileProcess, { createdAt: { $lt: date } });
  }
}
