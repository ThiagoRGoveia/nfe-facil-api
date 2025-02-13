import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBatchDto, FileDto } from '../dtos/create-batch.dto';
import { PinoLogger } from 'nestjs-pino';
import { DocumentProcessorPort } from '../ports/document-processor.port';
import { TemplateDbPort } from '@/core/templates/application/ports/templates-db.port';
import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';
import { OutputFormat } from '@/core/documents/domain/types/output-format.type';
import { CsvPort } from '@/infra/json-to-csv/ports/csv.port';
import { ExcelPort } from '@/infra/excel/ports/excel.port';

type SyncProcessDto = Omit<CreateBatchDto, 'files'> & {
  files: FileDto[];
  outputFormats?: OutputFormat[];
};

@Injectable()
export class PublicSyncFileProcessUseCase {
  private readonly MAX_FILES = 5;
  constructor(
    private readonly templateRepository: TemplateDbPort,
    private readonly documentProcessorPort: DocumentProcessorPort,
    private readonly logger: PinoLogger,
    private readonly csvConverterPort: CsvPort,
    private readonly excelPort: ExcelPort,
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

    const jsonResults = results.filter(({ result }) => result.isSuccess()).map(({ result }) => result.payload);

    // Add new format handling
    const formatResults: {
      json?: Buffer;
      csv?: Buffer;
      excel?: Buffer;
    } = {};

    if (dto.outputFormats) {
      const allResults = jsonResults;

      for (const format of dto.outputFormats) {
        switch (format) {
          case 'json':
            formatResults.json = Buffer.from(JSON.stringify(allResults));
            break;
          case 'csv':
            formatResults.csv = Buffer.from(
              this.csvConverterPort.convertToCsv(allResults as Record<string, unknown>[], {
                expandNestedObjects: true,
                unwindArrays: true,
              }),
            );
            break;
          case 'excel':
            formatResults.excel = await this.excelPort.convertToExcel(allResults as Record<string, unknown>[], {
              expandNestedObjects: true,
              unwindArrays: true,
            });
            break;
        }
      }
    }

    return formatResults;
  }
}
