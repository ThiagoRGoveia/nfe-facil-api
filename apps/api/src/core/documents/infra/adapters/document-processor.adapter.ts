import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { DocumentProcessorPort } from '../../application/ports/document-processor.port';

export class DocumentProcessorAdapter implements DocumentProcessorPort {
  process(processId: string, filePath: string, template: Template): Promise<DocumentProcessResult> {
    throw new Error('Not implemented');
  }
}
