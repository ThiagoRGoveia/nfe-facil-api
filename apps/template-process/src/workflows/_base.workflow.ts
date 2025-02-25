import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';
import { Template } from '@/core/templates/domain/entities/template.entity';

export abstract class BaseWorkflow {
  abstract execute(fileBuffer: Buffer, template: Template): Promise<DocumentProcessResult>;
}
