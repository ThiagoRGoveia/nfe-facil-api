import { Injectable } from '@nestjs/common';
import { Transform, PassThrough, Readable } from 'stream';
import { BatchProcess } from '@lib/documents/core/domain/entities/batch-process.entity';
import { CsvPort } from '@lib/csv/core/ports/csv.port';
import { ExcelPort } from '@lib/excel/core/ports/excel.port';
import { FileStoragePort } from '@lib/file-storage/core/ports/file-storage.port';
import { BatchDbPort } from '@lib/documents/core/application/ports/batch-db.port';
import { FileFormat } from '../../domain/constants/file-formats';
import { FileProcessDbPort } from '../ports/file-process-db.port';
import { DownloadPath } from '../../domain/value-objects/download-path.vo';

const MAX_FILES_PER_BATCH = 100;

@Injectable()
export class HandleOutputFormatUseCase {
  constructor(
    private readonly csvConverterPort: CsvPort,
    private readonly excelPort: ExcelPort,
    private readonly fileStoragePort: FileStoragePort,
    private readonly batchDbPort: BatchDbPort,
    private readonly fileProcessDbPort: FileProcessDbPort,
  ) {}

  async execute(batchProcess: BatchProcess): Promise<void> {
    const downloadPath = DownloadPath.forUser(batchProcess.user.id, batchProcess.id);

    // Create a stream of completed file results
    const resultsStream = this.fileProcessDbPort.findCompletedByBatchStream(batchProcess.id, MAX_FILES_PER_BATCH);

    // If more than one output is needed, duplicate the original stream.
    const streams =
      batchProcess.requestedFormats.length > 1
        ? this.duplicateStream(resultsStream, batchProcess.requestedFormats.length)
        : [resultsStream];

    // Create an array of upload promises so the transformations and uploads can happen concurrently.
    const uploadPromises = batchProcess.requestedFormats.map((format, index) => {
      const cloneStream = streams[index];

      if (format === FileFormat.JSON) {
        // Create a transformation stream that pipes data in JSON array format.
        const jsonArrayStream = new Transform({
          objectMode: true,
          transform(this: Transform & { hasStarted?: boolean }, chunk, _encoding, callback) {
            if (!this.hasStarted) {
              this.hasStarted = true;
              this.push('[');
            } else {
              this.push(',');
            }
            this.push(JSON.stringify(chunk));
            callback();
          },
          flush(callback) {
            this.push(']');
            callback();
          },
        });
        // Pipe clone stream to conversion stream.
        const formatStream = cloneStream.pipe(jsonArrayStream);
        batchProcess.jsonResults = downloadPath.forUserExtension('json');
        return this.fileStoragePort.uploadFromStream(
          downloadPath.forUserExtension('json'),
          formatStream,
          'application/json',
        );
      } else if (format === FileFormat.CSV) {
        const csvStream = this.csvConverterPort.convertStreamToCsv(cloneStream, {
          expandNestedObjects: true,
          unwindArrays: true,
        });
        batchProcess.csvResults = downloadPath.forUserExtension('csv');
        return this.fileStoragePort.uploadFromStream(downloadPath.forUserExtension('csv'), csvStream, 'text/csv');
      } else if (format === FileFormat.XLSX) {
        const excelStream = this.excelPort.convertStreamToExcel(cloneStream, {
          expandNestedObjects: true,
          unwindArrays: true,
        });
        batchProcess.excelResults = downloadPath.forUserExtension('xlsx');
        return this.fileStoragePort.uploadFromStream(
          downloadPath.forUserExtension('xlsx'),
          excelStream,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
      }
    });

    // Wait for all conversion/upload streams to finish concurrently.
    await Promise.all(uploadPromises);
    await this.batchDbPort.save();
  }

  private duplicateStream(source: Readable, copies: number): Readable[] {
    const clones: PassThrough[] = [];
    for (let i = 0; i < copies; i++) {
      clones.push(new PassThrough({ objectMode: true }));
    }

    source.on('data', (chunk) => {
      for (const clone of clones) {
        // Write to each clone if it hasn't been destroyed.
        if (!clone.destroyed) {
          clone.write(chunk);
        }
      }
    });

    source.on('end', () => {
      for (const clone of clones) {
        clone.end();
      }
    });

    source.on('error', (err) => {
      for (const clone of clones) {
        clone.destroy(err);
      }
    });

    return clones;
  }
}
