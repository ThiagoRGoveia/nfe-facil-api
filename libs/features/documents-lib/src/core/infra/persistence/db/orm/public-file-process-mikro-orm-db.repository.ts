import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';
import { PublicFileProcessDbPort } from '@/core/documents/application/ports/public-file-process-db.port';
import { PublicFileProcess } from '@/core/documents/domain/entities/public-file-process.entity';

@Injectable()
export class PublicFileProcessMikroOrmDbRepository
  extends EntityRepository(PublicFileProcess)
  implements PublicFileProcessDbPort
{
  async findByIds(ids: string[]): Promise<PublicFileProcess[]> {
    return this.em.find(PublicFileProcess, { id: { $in: ids } });
  }

  async deleteOlderThan(date: Date): Promise<void> {
    await this.em.nativeDelete(PublicFileProcess, { createdAt: { $lt: date } });
  }
}
