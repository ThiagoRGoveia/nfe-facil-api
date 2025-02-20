import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBatchDto, FileDto } from '../dtos/create-batch.dto';
import { PinoLogger } from 'nestjs-pino';
import { DocumentProcessorPort } from '../ports/document-processor.port';
import { TemplateDbPort } from '@/core/templates/application/ports/templates-db.port';
import { DocumentProcessResult } from '@doc/core/domain/value-objects/document-process-result';
import { OutputFormat } from '@/core/documents/domain/types/output-format.type';
import { CsvPort } from '@/infra/json-to-csv/ports/csv.port';
import { ExcelPort } from '@/infra/excel/ports/excel.port';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';
import { PublicFileProcessDbPort } from '../ports/public-file-process-db.port';
import { PublicFileProcessStatus } from '../../domain/entities/public-file-process.entity';
import { FileFormat } from '../../domain/constants/file-formats';
import { ConfigService } from '@nestjs/config';

type SyncProcessDto = Omit<CreateBatchDto, 'files'> & {
  files: FileDto[];
  outputFormats?: OutputFormat[];
};

type Response = {
  json?: string;
  csv?: string;
  excel?: string;
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
    private readonly fileStorage: FileStoragePort,
    private readonly uuidAdapter: UuidAdapter,
    private readonly publicFileProcessRepository: PublicFileProcessDbPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: SyncProcessDto): Promise<Response> {
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
          // Save file to storage
          const filePath = `public/${this.uuidAdapter.generate()}.${doc.fileName.split('.').pop()}`;
          // await this.fileStorage.uploadFromBuffer(filePath, doc.data);

          // Create public file process record
          const fileProcess = this.publicFileProcessRepository.create({
            fileName: doc.fileName,
            filePath,
            template,
            status: PublicFileProcessStatus.COMPLETED,
          });

          // Process the document
          const result = await this.documentProcessorPort.process(doc.data, template);

          if (result.isSuccess()) {
            fileProcess.setResult(result.payload);
            fileProcess.markCompleted();
          } else {
            fileProcess.markFailed(result.errorMessage || 'Unknown error');
            fileProcess.setResult(result.payload);
          }

          await this.publicFileProcessRepository.save();

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
    const formatResults: Response = {};
    const apiUrl = this.configService.get<string>('API_URL');

    if (dto.outputFormats) {
      const allResults = jsonResults;

      for (const format of dto.outputFormats) {
        const fileId = this.uuidAdapter.generate();

        switch (format) {
          case FileFormat.JSON: {
            const jsonBuffer = Buffer.from(JSON.stringify(allResults));
            await this.fileStorage.uploadFromBuffer(`downloads/${fileId}.json`, jsonBuffer, 'application/json');
            formatResults.json = `${apiUrl}/api/v1/downloads/${fileId}.json`;
            break;
          }
          case FileFormat.CSV: {
            const csvBuffer = Buffer.from(
              this.csvConverterPort.convertToCsv(allResults as Record<string, unknown>[], {
                expandNestedObjects: true,
                unwindArrays: true,
              }),
            );
            await this.fileStorage.uploadFromBuffer(`downloads/${fileId}.csv`, csvBuffer, 'text/csv');
            formatResults.csv = `${apiUrl}/api/v1/downloads/${fileId}.csv`;
            break;
          }
          case FileFormat.XLSX: {
            const excelBuffer = await this.excelPort.convertToExcel(allResults as Record<string, unknown>[], {
              expandNestedObjects: true,
              unwindArrays: true,
            });
            await this.fileStorage.uploadFromBuffer(
              `downloads/${fileId}.xlsx`,
              excelBuffer,
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            );
            formatResults.excel = `${apiUrl}/api/v1/downloads/${fileId}.xlsx`;
            break;
          }
        }
      }
    }

    return formatResults;
  }
}
