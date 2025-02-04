import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';
import { DocumentProcessDbPort } from '@/core/documents/application/ports/document-process-db.port';
import { DocumentProcess } from '@/core/documents/domain/entities/document-process.entity';
import { RequiredEntityData } from '@mikro-orm/core';

@Injectable()
export class DocumentProcessMikroOrmDbRepository
  extends EntityRepository(DocumentProcess)
  implements DocumentProcessDbPort
{
  create(process: RequiredEntityData<DocumentProcess>): DocumentProcess {
    const newProcess = this.em.create(DocumentProcess, process);
    this.em.persist(newProcess);
    return newProcess;
  }

  update(id: string, process: Partial<RequiredEntityData<DocumentProcess>>): DocumentProcess {
    const existingProcess = this.em.getReference(DocumentProcess, id);
    this.em.assign(existingProcess, process);
    return existingProcess;
  }

  async findByTemplateId(templateId: string): Promise<DocumentProcess[]> {
    return this.em.find(DocumentProcess, { template: { id: templateId } });
  }
}
