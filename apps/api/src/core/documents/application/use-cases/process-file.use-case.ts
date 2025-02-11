import { BadRequestException, Injectable } from '@nestjs/common';
import { FileToProcess } from '@/core/documents/domain/entities/file-process.entity';
import { DocumentProcessorPort } from '@/core/documents/application/ports/document-processor.port';
import { WebhookNotifierPort } from '@/core/documents/application/ports/webhook-notifier.port';
import { FileProcessDbPort } from '@/core/documents/application/ports/file-process-db.port';
import { User } from '@/core/users/domain/entities/user.entity';
import { BatchDbPort } from '@/core/documents/application/ports/batch-db.port';
export interface ProcessFileParams {
  user: User;
  file: FileToProcess;
}

@Injectable()
export class ProcessFileUseCase {
  constructor(
    private readonly fileProcessDbPort: FileProcessDbPort,
    private readonly documentProcessorPort: DocumentProcessorPort,
    private readonly webhookNotifierPort: WebhookNotifierPort,
    private readonly batchDbPort: BatchDbPort,
  ) {}

  async execute(params: ProcessFileParams): Promise<FileToProcess> {
    const { file, user } = params;
    const template = await file.template.load();
    if (!template) {
      throw new BadRequestException('Template not found');
    }

    if (!template.isAccessibleByUser(user)) {
      throw new BadRequestException("You don't have access to this template");
    }

    file.markProcessing();
    await this.fileProcessDbPort.save();

    if (!file.filePath) {
      throw new BadRequestException('Missing file for file processing');
    }

    const result = await this.documentProcessorPort.process(file.id, file.filePath, template);

    if (result.isSuccess()) {
      file.setResult(result.payload);
      file.markCompleted();
      await this.webhookNotifierPort.notifySuccess(file);
      file.markNotified();
    } else if (result.isError()) {
      file.markFailed(result.errorMessage);
      await this.webhookNotifierPort.notifyFailure(file);
      file.markNotified();
    }
    if (file.batchProcess) {
      await this.batchDbPort.incrementProcessedFilesCount(file.batchProcess.id);
    }
    await this.fileProcessDbPort.save();
    return file;
  }
}
