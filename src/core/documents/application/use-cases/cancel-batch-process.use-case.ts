import { Injectable } from '@nestjs/common';
import { BatchDbPort } from '../ports/batch-db.port';
import { BatchStatus } from '../../domain/entities/batch-process.entity';
import { BatchOperationForbiddenError } from '../../domain/errors/batch-errors';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';

@Injectable()
export class CancelBatchProcessUseCase {
  constructor(
    private readonly batchRepository: BatchDbPort,
    private readonly fileStoragePort: FileStoragePort,
  ) {}

  async execute(batchId: string) {
    const batch = await this.batchRepository.findByIdWithFiles(batchId);

    if (batch.status !== BatchStatus.CREATED) {
      throw new BatchOperationForbiddenError('Cannot cancel a batch that has already started');
    }

    await this.fileStoragePort.deleteFolder(`uploads/${batch.user.id}/batch/${batch.id}`);

    this.batchRepository.update(batchId, { status: BatchStatus.CANCELLED });
    await this.batchRepository.save();
  }
}
