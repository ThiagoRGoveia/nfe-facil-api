import { Injectable } from '@nestjs/common';
import { BatchDbPort } from '../ports/batch-db.port';
import { BatchStatus } from '../../domain/entities/batch-process.entity';
import { BatchOperationForbiddenError } from '../../domain/errors/batch-errors';

@Injectable()
export class UpdateBatchTemplateUseCase {
  constructor(private readonly batchRepository: BatchDbPort) {}

  async execute(batchId: string, templateId: string) {
    const batch = await this.batchRepository.findByIdWithFiles(batchId);

    if (batch.status !== BatchStatus.CREATED) {
      throw new BatchOperationForbiddenError('Cannot update template of a started batch');
    }

    this.batchRepository.update(batchId, { templateId });
    await this.batchRepository.save();
  }
}
