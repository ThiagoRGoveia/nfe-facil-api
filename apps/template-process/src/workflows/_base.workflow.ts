import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { PinoLogger } from 'nestjs-pino';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';

export abstract class BaseWorkflow<T extends Record<string, unknown> = Record<string, unknown>> {
  constructor(
    protected readonly fileStoragePort: FileStoragePort,
    protected readonly logger: PinoLogger,
  ) {}

  abstract execute(fileBuffer: Buffer, template: Template): Promise<DocumentProcessResult>;

  public isTemplateMetadata(template: Template, requiredFields: string[]): template is Template<T> {
    return requiredFields.every((field) => field in template.metadata);
  }

  public deepEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}
