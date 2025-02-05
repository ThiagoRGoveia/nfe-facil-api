import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { DocumentProcess, DocumentProcessStatus } from '../../domain/entities/document-process.entity';
import { DocumentProcessorPort } from '../ports/document-processor.port';
import { WebhookNotifierPort } from '../ports/webhook-notifier.port';
import { TemplateDbPort } from '@/core/templates/templates.module';
import { DocumentProcessDbPort } from '../ports/document-process-db.port';
import { User } from '@/core/users/domain/entities/user.entity';
import { BatchDbPort } from '../ports/batch-db.port';

export interface ProcessDocumentParams {
  user: User;
  templateId: string;
  file: {
    fileName: string;
    filePath: string;
  };
  batchId?: string;
}

@Injectable()
export class ProcessDocumentUseCase {
  constructor(
    private readonly documentTemplatePort: TemplateDbPort,
    private readonly documentProcessDbPort: DocumentProcessDbPort,
    private readonly documentProcessorPort: DocumentProcessorPort,
    private readonly webhookNotifierPort: WebhookNotifierPort,
    private readonly batchRepository: BatchDbPort,
  ) {}

  async execute(params: ProcessDocumentParams): Promise<DocumentProcess> {
    const template = await this.documentTemplatePort.findById(params.templateId);
    if (!template) {
      throw new BadRequestException('Template not found');
    }

    if (!template.isAccessibleByUser(params.user)) {
      throw new BadRequestException("You don't have access to this template");
    }

    const documentProcess = this.documentProcessDbPort.create({
      template: template,
      fileName: params.file.fileName,
      filePath: params.file.filePath,
      status: DocumentProcessStatus.PENDING,
      batchProcess: params.batchId ? this.batchRepository.ref(params.batchId) : undefined,
    });

    await this.documentProcessDbPort.save();

    documentProcess.markProcessing();
    await this.documentProcessDbPort.save();

    const result = await this.documentProcessorPort.process(documentProcess.id, params.file.filePath, template);

    if (result.isSuccess()) {
      documentProcess.setPayload(result.payload);
      documentProcess.markCompleted();
      await this.webhookNotifierPort.notifySuccess(documentProcess);
    } else if (result.isError()) {
      documentProcess.markFailed(result.errorMessage);
      await this.webhookNotifierPort.notifyFailure(documentProcess);
    } else {
      throw new InternalServerErrorException('Invalid document process result');
    }

    await this.documentProcessDbPort.save();
    return documentProcess;
  }
}
