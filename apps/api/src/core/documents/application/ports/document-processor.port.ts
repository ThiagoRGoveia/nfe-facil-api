import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { FileToProcess } from '../../domain/entities/file-process.entity';

export abstract class DocumentProcessorPort {
  /**
   * Initiates asynchronous document processing
   * @param file The file to process
   * @param template The template to use for processing
   */
  abstract process(file: FileToProcess, template: Template): Promise<DocumentProcessResult>;
}
