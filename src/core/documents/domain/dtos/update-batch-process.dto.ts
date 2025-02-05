import { PartialType } from '@nestjs/mapped-types';
import { BatchProcess } from '../entities/batch-process.entity';
import { BatchStatus } from '../entities/batch-process.entity';
import { PickType } from '@nestjs/swagger';
export class UpdateBatchProcessDto extends PartialType(PickType(BatchProcess, ['status', 'template'] as const)) {
  templateId?: string;
  status?: BatchStatus;
}
