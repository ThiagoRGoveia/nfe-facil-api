import { RequiredEntityData } from '@mikro-orm/core';
import { DocumentProcess } from '../../domain/entities/document-process.entity';
import { BaseDbPort } from '@/infra/ports/_base-db-port';

export abstract class DocumentProcessDbPort extends BaseDbPort<DocumentProcess> {
  abstract create(process: RequiredEntityData<DocumentProcess>): DocumentProcess;
  abstract update(id: string, process: Partial<RequiredEntityData<DocumentProcess>>): DocumentProcess;
  abstract findByTemplateId(templateId: string): Promise<DocumentProcess[]>;
}
