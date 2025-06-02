import { DocumentProcessResult } from 'apps/process-document-job/src/core/domain/value-objects/document-process-result';
import { Template } from '@lib/templates/core/domain/entities/template.entity';

export abstract class DocumentProcessorPort {
  /**
   * Initiates asynchronous document processing
   * @param fileBuffer The buffer of the file to process
   * @param template The template to use for processing
   */
  abstract process(fileBuffer: Buffer, template: Template): Promise<DocumentProcessResult>;
}
