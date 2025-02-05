import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { FileToProcess, FileProcessStatus } from '../../domain/entities/file-process.entity';
import { DocumentProcessorPort } from '../ports/document-processor.port';
import { WebhookNotifierPort } from '../ports/webhook-notifier.port';
import { FileProcessDbPort } from '../ports/file-process-db.port';
import { User } from '@/core/users/domain/entities/user.entity';

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
  ) {}

  async execute(params: ProcessFileParams): Promise<FileToProcess> {
    const template = await params.file.template.load();
    if (!template) {
      throw new BadRequestException('Template not found');
    }

    if (!template.isAccessibleByUser(params.user)) {
      throw new BadRequestException("You don't have access to this template");
    }

    const fileProcess = this.fileProcessDbPort.create({
      template: template,
      fileName: params.file.fileName,
      filePath: params.file.filePath,
      status: FileProcessStatus.PENDING,
      batchProcess: params.file.batchProcess,
    });

    await this.fileProcessDbPort.save();

    fileProcess.markProcessing();
    await this.fileProcessDbPort.save();

    if (!params.file.filePath) {
      throw new BadRequestException('Missing file for file processing');
    }

    const result = await this.documentProcessorPort.process(fileProcess.id, params.file.filePath, template);

    if (result.isSuccess()) {
      fileProcess.setPayload(result.payload);
      fileProcess.markCompleted();
      await this.webhookNotifierPort.notifySuccess(fileProcess);
    } else if (result.isError()) {
      fileProcess.markFailed(result.errorMessage);
      await this.webhookNotifierPort.notifyFailure(fileProcess);
    } else {
      throw new InternalServerErrorException('Invalid file process result');
    }

    await this.fileProcessDbPort.save();
    return fileProcess;
  }
}
