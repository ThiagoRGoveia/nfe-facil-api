import { FileToProcess, FileProcessStatus } from '../../domain/entities/file-process.entity';
import { BaseDbPort } from '@/infra/ports/_base-db-port';
import { Readable } from 'stream';
import { BatchProcess } from '../../domain/entities/batch-process.entity';
export abstract class FileProcessDbPort extends BaseDbPort<FileToProcess> {
  abstract findByBatchPaginated(batchId: BatchProcess['id'], limit: number, offset: number): Promise<FileToProcess[]>;
  abstract findByBatchPaginatedAndStatus(
    batchId: BatchProcess['id'],
    status: FileProcessStatus,
    limit: number,
    offset: number,
  ): Promise<FileToProcess[]>;
  abstract findCompletedByBatchStream(batchId: BatchProcess['id'], limit: number): Readable;
  abstract deleteByBatchId(batchId: BatchProcess['id']): Promise<void>;
  abstract countByBatchAndStatus(batchId: BatchProcess['id'], status: FileProcessStatus): Promise<number>;
}
