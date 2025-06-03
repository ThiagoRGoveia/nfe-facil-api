import { FileRecord, FileProcessStatus } from '../../domain/entities/file-records.entity';
import { BaseDbPort } from '@lib/commons/core/ports/_base-db-port';
import { Readable } from 'stream';
import { BatchProcess } from '../../domain/entities/batch-process.entity';
export abstract class FileProcessDbPort extends BaseDbPort<FileRecord> {
  abstract findByBatchPaginated(batchId: BatchProcess['id'], limit: number, offset: number): Promise<FileRecord[]>;
  abstract findByBatchPaginatedAndStatus(
    batchId: BatchProcess['id'],
    status: FileProcessStatus,
    limit: number,
    offset: number,
  ): Promise<FileRecord[]>;
  abstract findCompletedByBatchStream(batchId: BatchProcess['id'], limit: number): Readable;
  abstract deleteByBatchId(batchId: BatchProcess['id']): Promise<void>;
  abstract countByBatchAndStatus(batchId: BatchProcess['id'], status: FileProcessStatus): Promise<number>;
}
