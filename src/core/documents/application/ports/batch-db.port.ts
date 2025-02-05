import { Injectable } from '@nestjs/common';
import { BatchProcess } from '../../domain/entities/batch-process.entity';
import { BatchFile } from '../../domain/entities/batch-file.entity';
import { UpdateBatchProcessDto } from '../../domain/dtos/update-batch-process.dto';
import { BaseDbPort } from '@/infra/ports/_base-db-port';

@Injectable()
export abstract class BatchDbPort extends BaseDbPort<BatchProcess> {
  abstract findByIdWithFiles(id: string): Promise<BatchProcess>;
  abstract addFileToBatch(batchId: string, file: BatchFile): Promise<void>;
  abstract removeFileFromBatch(batchId: string, fileId: string): Promise<void>;
  abstract update(id: BatchProcess['id'], dto: UpdateBatchProcessDto): BatchProcess;
  abstract incrementProcessedFilesCount(id: BatchProcess['id']): Promise<void>;
}
