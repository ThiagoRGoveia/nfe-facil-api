import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';
import { Template } from '@/core/templates/domain/entities/template.entity';

export abstract class DocumentProcessorPort {
  /**
   * Initiates asynchronous document processing
   * @param fileBuffer The buffer of the file to process
   * @param template The template to use for processing
   */
  abstract process(fileBuffer: Buffer, template: Template): Promise<DocumentProcessResult>;
}
