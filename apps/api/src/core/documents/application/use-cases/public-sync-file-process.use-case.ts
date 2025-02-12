import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBatchDto, FileDto } from '../dtos/create-batch.dto';
import { PinoLogger } from 'nestjs-pino';
import { DocumentProcessorPort } from '../ports/document-processor.port';
import { TemplateDbPort } from '@/core/templates/application/ports/templates-db.port';
import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';

type SyncProcessDto = Omit<CreateBatchDto, 'files'> & {
  files: FileDto[];
};

@Injectable()
export class PublicSyncFileProcessUseCase {
  private readonly MAX_FILES = 5;
  constructor(
    private readonly templateRepository: TemplateDbPort,
    private readonly documentProcessorPort: DocumentProcessorPort,
    private readonly logger: PinoLogger,
  ) {}

  async execute(dto: SyncProcessDto) {
    const template = await this.templateRepository.findById(dto.templateId);
    if (!template) {
      throw new BadRequestException('Template not found');
    }

    if (dto.files.length > this.MAX_FILES) {
      throw new BadRequestException(`Up to ${this.MAX_FILES} files are allowed to be processed at once`);
    }

    const files = dto.files;
    // Process files in parallel
    const results = await Promise.all(
      files.map(async (doc) => {
        try {
          const result = await this.documentProcessorPort.process(doc.data, template);
          return {
            fileName: doc.fileName,
            result,
          };
        } catch (error) {
          this.logger.error(`Error processing file ${doc.fileName}:`, error);
          return {
            fileName: doc.fileName,
            result: DocumentProcessResult.fromError({
              code: 'PROCESS_ERROR',
              message: error.message,
            }),
          };
        }
      }),
    );
    return results;
  }
}
