import { DocumentProcessResult } from '@/core/template-processes/domain/value-objects/document-process-result';
import { Template } from '@/core/templates/domain/entities/template.entity';

export abstract class DocumentProcessorPort {
  /**
   * Initiates asynchronous document processing
   * @param processId The ID of the document process
   * @param filePath Storage path key for the document
   * @param template The template to use for processing
   */
  abstract process(processId: string, filePath: string, template: Template): Promise<DocumentProcessResult>;
}
