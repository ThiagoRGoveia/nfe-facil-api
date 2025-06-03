import { DocumentProcessResult } from 'apps/process-document-job/src/core/domain/value-objects/document-process-result';
import { Template } from '@lib/templates/core/domain/entities/template.entity';

export abstract class BaseWorkflow {
  abstract execute(fileBuffer: Buffer, template: Template): Promise<DocumentProcessResult>;
}
