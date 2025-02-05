import { Injectable } from '@nestjs/common';
import { BatchProcess } from '../../domain/entities/batch-process.entity';
import { BaseDbPort } from '@/infra/ports/_base-db-port';

@Injectable()
export abstract class BatchDbPort extends BaseDbPort<BatchProcess> {
  abstract findByIdWithFiles(id: string): Promise<BatchProcess>;
  abstract removeFileFromBatch(batchId: string, fileId: string): Promise<void>;
  abstract incrementProcessedFilesCount(id: BatchProcess['id']): Promise<void>;
}
