import { BadRequestException, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { TemplateDbPort } from '@lib/templates/core/application/ports/templates-db.port';
import { DocumentProcessResult } from 'apps/process-document-job/src/core/domain/value-objects/document-process-result';
import { OutputFormat } from '@lib/documents/core/domain/types/output-format.type';
import { CsvPort } from '@lib/csv/core/ports/csv.port';
import { ExcelPort } from '@lib/excel/core/ports/excel.port';
import { FileStoragePort } from '@lib/file-storage/core/ports/file-storage.port';
import { UuidAdapter } from '@lib/uuid/core/uuid.adapter';
import { ConfigService } from '@nestjs/config';
import { PublicFileProcessDbPort } from '@lib/documents/core/application/ports/public-file-process-db.port';
import { CreateBatchDto, FileDto } from '@lib/documents/core/application/dtos/create-batch.dto';
import { DocumentProcessorPort } from '@lib/workflows/core/application/ports/document-processor.port';
import { DownloadPath } from '@lib/documents/core/domain/value-objects/download-path.vo';
import { FileFormat } from '@lib/documents/core/domain/constants/file-formats';

type SyncProcessDto = Omit<CreateBatchDto, 'files'> & {
  files: FileDto[];
  outputFormats?: OutputFormat[];
};

type Response = {
  json?: string;
  csv?: string;
  excel?: string;
  errors?: {
    fileName: string;
    error?: string;
  }[];
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

    // Generate a process id and create a DownloadPath for public processes
    const processId = this.uuidAdapter.generate();
    const downloadPath = DownloadPath.forPublic(processId);

    const files = dto.files;
    // Process files in parallel
    const results = await Promise.all(
      files.map(async (doc) => {
        // Create public file process record
        const filePath = downloadPath.forPublicFile(`${this.uuidAdapter.generate()}.${doc.fileName.split('.').pop()}`);
        const fileProcess = this.publicFileProcessRepository.create({
          fileName: doc.fileName,
          filePath,
          template,
        });
        try {
          // Save file to storage using the downloadPath
          await this.fileStorage.uploadFromBuffer(filePath, doc.data);

          // Process the document
          const result = await this.documentProcessorPort.process(doc.data, template);

          if (result.isSuccess()) {
            fileProcess.setResult(result.payload);
            fileProcess.markCompleted();
          } else {
            fileProcess.markFailed(result.errorMessage || 'Unknown error');
            fileProcess.setResult(result.payload);
          }

          return {
            fileName: doc.fileName,
            result,
          };
        } catch (error) {
          this.logger.error(`Error processing file ${doc.fileName}:`, error);
          fileProcess.markFailed(error.message);
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
    const errors = results
      .filter(({ result }) => result.isError())
      .map(({ fileName, result }) => ({
        fileName,
        error: result.errorMessage,
      }));

    // Add new format handling
    const formatResults: Response = { errors };
    const apiUrl = this.configService.get<string>('API_URL');

    if (dto.outputFormats && jsonResults.length > 0) {
      const allResults = jsonResults;

      for (const format of dto.outputFormats) {
        const fileId = this.uuidAdapter.generate();

        switch (format) {
          case FileFormat.JSON: {
            const jsonBuffer = Buffer.from(JSON.stringify(allResults));
            const uploadPath = downloadPath.forPublicFile(`${fileId}.json`);
            await this.fileStorage.uploadFromBuffer(uploadPath, jsonBuffer, 'application/json');
            formatResults.json = `${apiUrl}/api/v1/${uploadPath}`;
            break;
          }
          case FileFormat.CSV: {
            const csvBuffer = Buffer.from(
              this.csvConverterPort.convertToCsv(allResults as Record<string, unknown>[], {
                expandNestedObjects: true,
                unwindArrays: true,
              }),
            );
            const uploadPath = downloadPath.forPublicFile(`${fileId}.csv`);
            await this.fileStorage.uploadFromBuffer(uploadPath, csvBuffer, 'text/csv');
            formatResults.csv = `${apiUrl}/api/v1/${uploadPath}`;
            break;
          }
          case FileFormat.XLSX: {
            const excelBuffer = await this.excelPort.convertToExcel(allResults as Record<string, unknown>[], {
              expandNestedObjects: true,
              unwindArrays: true,
            });
            const uploadPath = downloadPath.forPublicFile(`${fileId}.xlsx`);
            await this.fileStorage.uploadFromBuffer(
              uploadPath,
              excelBuffer,
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            );
            formatResults.excel = `${apiUrl}/api/v1/${uploadPath}`;
            break;
          }
        }
      }
    }
    await this.publicFileProcessRepository.save();
    return formatResults;
  }
}
