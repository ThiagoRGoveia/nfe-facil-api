import { BadRequestException, Injectable } from '@nestjs/common';
import { FileToProcess } from '@/core/documents/domain/entities/file-process.entity';
import { DocumentProcessorPort } from '@/core/documents/application/ports/document-processor.port';
import { WebhookNotifierPort } from '@/core/documents/application/ports/webhook-notifier.port';
import { FileProcessDbPort } from '@/core/documents/application/ports/file-process-db.port';
import { BatchDbPort } from '@/core/documents/application/ports/batch-db.port';
import { FileStoragePort } from '@/infra/aws/s3/ports/file-storage.port';
import { HandleOutputFormatUseCase } from './handle-output-format.use-case';

export interface ProcessFileParams {
  fileId: FileToProcess['id'];
}

@Injectable()
export class ProcessFileUseCase {
  constructor(
    private readonly fileProcessDbPort: FileProcessDbPort,
    private readonly documentProcessorPort: DocumentProcessorPort,
    private readonly webhookNotifierPort: WebhookNotifierPort,
    private readonly batchDbPort: BatchDbPort,
    private readonly fileStoragePort: FileStoragePort,
    private readonly handleOutputFormatUseCase: HandleOutputFormatUseCase,
  ) {}

  async execute(params: ProcessFileParams): Promise<FileToProcess> {
    const { fileId } = params;
    const file = await this.fileProcessDbPort.findById(fileId);

    const user = await file?.user.load();

    if (!file || !user) {
      throw new BadRequestException('File or user not found');
    }

    const template = await file.template.load();
    const batchProcess = await file.batchProcess?.load();

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

    const pdfBuffer = await this.fileStoragePort.getBuffer(file.filePath);

    const result = await this.documentProcessorPort.process(pdfBuffer, template);

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
    if (batchProcess) {
      const updatedBatchProcess = await this.batchDbPort.incrementProcessedFilesCount(batchProcess.id);
      if (updatedBatchProcess.totalFiles === updatedBatchProcess.processedFiles) {
        updatedBatchProcess.markCompleted();
        await this.handleOutputFormatUseCase.execute(updatedBatchProcess);
        await this.webhookNotifierPort.notifyBatchCompleted(updatedBatchProcess);
      }
    }

    await this.fileProcessDbPort.save();
    return file;
  }
}
