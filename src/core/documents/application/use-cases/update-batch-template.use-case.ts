import { Injectable } from '@nestjs/common';
import { BatchDbPort } from '../ports/batch-db.port';
import { BatchProcess, BatchStatus } from '../../domain/entities/batch-process.entity';
import { BatchOperationForbiddenError } from '../../domain/errors/batch-errors';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { TemplateDbPort } from '@/core/templates/application/ports/templates-db.port';

@Injectable()
export class UpdateBatchTemplateUseCase {
  constructor(
    private readonly batchRepository: BatchDbPort,
    private readonly templateRepository: TemplateDbPort,
  ) {}

  async execute(batchId: BatchProcess['id'], templateId: Template['id']) {
    const batch = await this.batchRepository.findByIdWithFiles(batchId);

    if (batch.status !== BatchStatus.CREATED) {
      throw new BatchOperationForbiddenError('Cannot update template of a started batch');
    }

    this.batchRepository.update(batchId, { template: this.templateRepository.ref(templateId) });
    await this.batchRepository.save();
  }
}
