import { Injectable } from '@nestjs/common';
import { BaseDbPort } from '@/infra/ports/_base-db-port';
import { BatchFile } from '../../domain/entities/batch-file.entity';

@Injectable()
export abstract class BatchFileDbPort extends BaseDbPort<BatchFile> {
  abstract findByBatchPaginated(batchId: string, limit: number, offset: number): Promise<BatchFile[]>;
}
