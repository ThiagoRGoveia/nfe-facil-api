import { FileToProcess, FileProcessStatus } from '../../domain/entities/file-process.entity';
import { BaseDbPort } from '@/infra/ports/_base-db-port';
import { Readable } from 'stream';
export abstract class FileProcessDbPort extends BaseDbPort<FileToProcess> {
  abstract findByBatchPaginated(batchId: string, limit: number, offset: number): Promise<FileToProcess[]>;
  abstract findByBatchPaginatedAndStatus(
    batchId: string,
    status: FileProcessStatus,
    limit: number,
    offset: number,
  ): Promise<FileToProcess[]>;
  abstract findCompletedByBatchStream(batchId: string, limit: number): Readable;
  abstract deleteByBatchId(batchId: string): Promise<void>;
  abstract countByBatchAndStatus(batchId: string, status: FileProcessStatus): Promise<number>;
}
