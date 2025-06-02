import { Injectable, NotFoundException } from '@nestjs/common';
import { BatchDbPort } from '../ports/batch-db.port';
import { BatchProcess, BatchStatus } from '../../domain/entities/batch-process.entity';
import { BatchOperationForbiddenError } from '../../domain/errors/batch-errors';
import { Template } from '@lib/templates/core/domain/entities/template.entity';
import { TemplateDbPort } from '@lib/templates/core/application/ports/templates-db.port';
import { User, UserRole } from '@lib/users/core/domain/entities/user.entity';

export class UpdateBatchTemplateParams {
  batchId: BatchProcess['id'];
  templateId: Template['id'];
  user: User;
}

@Injectable()
export class UpdateBatchTemplateUseCase {
  constructor(
    private readonly batchRepository: BatchDbPort,
    private readonly templateRepository: TemplateDbPort,
  ) {}

  async execute(params: UpdateBatchTemplateParams) {
    const { batchId, templateId, user } = params;
    const batch = await this.batchRepository.findById(batchId);

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (batch.user.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new BatchOperationForbiddenError('Cannot update template of a started batch');
    }

    if (batch.status !== BatchStatus.CREATED) {
      throw new BatchOperationForbiddenError('Cannot update template of a started batch');
    }

    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (!template.isAccessibleByUser(user)) {
      throw new BatchOperationForbiddenError('Cannot update template of a started batch');
    }

    this.batchRepository.update(batchId, { template });
    await this.batchRepository.save();
  }
}
