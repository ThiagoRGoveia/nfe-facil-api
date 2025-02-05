import { FileToProcess, FileProcessStatus } from '../../domain/entities/file-process.entity';
import { BaseDbPort } from '@/infra/ports/_base-db-port';

export abstract class FileProcessDbPort extends BaseDbPort<FileToProcess> {
  abstract findByBatchPaginated(batchId: string, limit: number, offset: number): Promise<FileToProcess[]>;
  abstract deleteByBatchId(batchId: string): Promise<void>;
  abstract countByBatchAndStatus(batchId: string, status: FileProcessStatus): Promise<number>;
}
