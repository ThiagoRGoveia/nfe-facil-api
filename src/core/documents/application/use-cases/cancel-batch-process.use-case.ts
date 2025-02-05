import { BadRequestException, Injectable } from '@nestjs/common';
import { BatchDbPort } from '../ports/batch-db.port';
import { BatchStatus } from '../../domain/entities/batch-process.entity';
import { BatchOperationForbiddenError } from '../../domain/errors/batch-errors';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { FileProcessDbPort } from '../ports/file-process-db.port';

@Injectable()
export class CancelBatchProcessUseCase {
  constructor(
    private readonly batchRepository: BatchDbPort,
    private readonly fileProcessRepository: FileProcessDbPort,
    private readonly fileStoragePort: FileStoragePort,
  ) {}

  async execute(batchId: string) {
    const batch = await this.batchRepository.findById(batchId);

    if (!batch) {
      throw new BadRequestException('Batch not found');
    }

    if (batch.status !== BatchStatus.CREATED) {
      throw new BatchOperationForbiddenError('Cannot cancel a batch that has already started');
    }

    await this.fileStoragePort.deleteFolder(`uploads/${batch.user.id}/batch/${batch.id}`);

    // Delete all file processes associated with this batch
    await this.fileProcessRepository.deleteByBatchId(batchId);

    this.batchRepository.update(batchId, { status: BatchStatus.CANCELLED });
    await this.batchRepository.save();
  }
}
